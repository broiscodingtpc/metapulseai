import "dotenv/config";
import { connectPumpPortal } from "./ws";
import { cfg } from "./config";
import { Rollups } from "./rollups";
import { techScore, totalScore } from "@metapulse/core";
import { labelMeta } from "./metas";
import { makeBot, sendDigest, setupBotCommands } from "./telegram";
import { schedule } from "./scheduler";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const rollups = new Rollups();
const TOK_INFO = new Map<string, { name?: string; symbol?: string; desc?: string }>();
const SCORES = new Map<string, { tech: number; meta: number; total: number; label: string }>();

// Make variables globally accessible for Telegram bot
(globalThis as any).ROLLUPS = rollups;
(globalThis as any).TOK_INFO = TOK_INFO;
(globalThis as any).SCORES = SCORES;

connectPumpPortal(cfg.apiKey, async (msg: any) => {
  // Handle subscription confirmations and errors
  if (msg.message) {
    console.log("📢 PumpPortal:", msg.message);
    return;
  }
  
  if (msg.errors) {
    console.log("⚠️ PumpPortal:", msg.errors);
    return;
  }
  
  // Handle actual data messages
  console.log("📡 Data received:", JSON.stringify(msg, null, 2));
  
  // Handle new token events - these are actually token creation events from PumpPortal
  if (msg.txType === "create" && msg.mint) {
    const m = msg;
    console.log("🆕 New token detected:", m.name, m.symbol, m.mint);
    TOK_INFO.set(m.mint, { name: m.name, symbol: m.symbol, desc: m.uri });
    
    // Create stats based on the token creation data
    const initialBuy = m.initialBuy || 0;
    const solAmount = m.solAmount || 0;
    const marketCap = m.marketCapSol || 0;
    
    const mockStats = { 
      buyers: 1, 
      sellers: 0, 
      uniqBuyers: 1, 
      impact01: 0,
      initialBuy,
      solAmount,
      marketCap
    };
    
    const tech = techScore({
      mint: m.mint, name: m.name, symbol: m.symbol, desc: m.uri,
      buyers1m: mockStats.buyers, sellers1m: mockStats.sellers, 
      uniqBuyers1m: mockStats.uniqBuyers, priceImpact01: mockStats.impact01
    }, { minUniqueBuyers: cfg.minUniqueBuyers, maxImpactPct: cfg.maxImpactPct, minBuyerSeller: cfg.minBuyerSeller });

    const meta = await labelMeta({ name: m.name, symbol: m.symbol, desc: m.uri, stats: mockStats }, cfg.llmKey, cfg.llmModel);
    const total = totalScore(tech.score, meta.metaScore);
    SCORES.set(m.mint, { tech: tech.score, meta: meta.metaScore, total, label: meta.label });
    
    console.log("📊 Token scored:", m.name || "Unknown", "Score:", total, "Meta:", meta.label);
  }
  
  // Handle trade events (if we get them)
  if (msg.type === "tokenTrade") {
    const t = msg;
    console.log("💰 Trade detected:", t.mint, "buyer:", t.buyer, "seller:", t.seller);
    const now = Date.now() / 1000;
    rollups.add(t.mint, { t: now, buyer: t.buyer, seller: t.seller, price: t.price });

    const r = rollups.summary(t.mint, cfg.rollupWindowSec);
    const info = TOK_INFO.get(t.mint) || {};
    const tech = techScore({
      mint: t.mint, name: info.name, symbol: info.symbol, desc: info.desc,
      buyers1m: r.buyers, sellers1m: r.sellers, uniqBuyers1m: r.uniqBuyers, priceImpact01: r.impact01
    }, { minUniqueBuyers: cfg.minUniqueBuyers, maxImpactPct: cfg.maxImpactPct, minBuyerSeller: cfg.minBuyerSeller });

    const meta = await labelMeta({ name: info.name, symbol: info.symbol, desc: info.desc, stats: r }, cfg.llmKey, cfg.llmModel);
    const total = totalScore(tech.score, meta.metaScore);
    SCORES.set(t.mint, { tech: tech.score, meta: meta.metaScore, total, label: meta.label });
    
    console.log("📊 Token scored:", info.name || "Unknown", "Score:", total, "Meta:", meta.label);
  }
});

// hourly digest
const bot = makeBot(cfg.telegramToken);

// Setup interactive menu and commands
setupBotCommands(bot);

async function makeFeedAndNotify() {
  const mints = Array.from(SCORES.keys());
  const tokens = mints
    .map(mint => {
      const s = SCORES.get(mint)!; const info = TOK_INFO.get(mint) || {};
      return { mint, name: info.name, symbol: info.symbol, totalScore: s.total, label: s.label };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, cfg.topTokensLimit);

  const byMeta = new Map<string, { count: number; sum: number }>();
  for (const t of tokens) {
    const cur = byMeta.get(t.label) || { count: 0, sum: 0 };
    cur.count += 1; cur.sum += t.totalScore;
    byMeta.set(t.label, cur);
  }
  const metas = Array.from(byMeta.entries())
    .map(([label, v]) => ({ label, count: v.count, avgScore: Math.round(v.sum / v.count) }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, cfg.topMetasLimit);

  // dump feed JSON for website
  const feed = { generatedAt: new Date().toISOString(), metas, tokens };
  const webPublic = path.resolve(process.cwd(), "../../apps/web/public/feed.json");
  fs.mkdirSync(path.dirname(webPublic), { recursive: true });
  fs.writeFileSync(webPublic, JSON.stringify(feed, null, 2));

  // push to Telegram (only if chat ID is configured)
  if (cfg.telegramChatId) {
    await sendDigest(bot, cfg.telegramChatId, { metas, tokens });
  }
}

// schedule hourly via cron, and also run once at boot after 30s warmup
schedule(cfg.cron, () => { makeFeedAndNotify().catch(() => {}); });
setTimeout(() => { makeFeedAndNotify().catch(() => {}); }, 30_000);

console.log("MetaPulse AI Bot is live: hourly digests enabled.");

// Create HTTP server for API endpoints
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/feed.json') {
    const data = {
      tokens: Array.from(TOK_INFO.entries()).map(([address, info]) => ({
        address,
        ...info,
        score: SCORES.get(address)?.total || 0,
        category: SCORES.get(address)?.label || 'unknown'
      })),
      metas: Array.from(SCORES.values()).reduce((acc, score) => {
        const category = score.label;
        if (!acc[category]) {
          acc[category] = { count: 0, avgScore: 0, totalScore: 0 };
        }
        acc[category].count++;
        acc[category].totalScore += score.total;
        acc[category].avgScore = acc[category].totalScore / acc[category].count;
        return acc;
      }, {} as Record<string, { count: number; avgScore: number; totalScore: number }>),
      generatedAt: new Date().toISOString(),
      stats: {
        totalTokens: TOK_INFO.size,
        totalMetas: Object.keys(SCORES).length,
        totalMarketCap: rollups.totalMarketCap,
        totalVolume: rollups.totalVolume
      }
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
    return;
  }
  
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'active', 
      message: 'Bot is running and scanning tokens',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const PORT = process.env.BOT_PORT || 3000;
server.listen(PORT, () => {
  console.log(`🤖 Bot HTTP server running on port ${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   - http://localhost:${PORT}/feed.json`);
  console.log(`   - http://localhost:${PORT}/status`);
});
