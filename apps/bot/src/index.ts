import "dotenv/config";
import { connectPumpPortal } from "./ws.js";
import { cfg } from "./config.js";
import { Rollups } from "./rollups.js";
import { techScore, totalScore, analyzeRisk, getRiskEmoji } from "@metapulse/core";
import { labelMeta } from "./metas.js";
import { makeBot, sendDigest, setupBotCommands, sendBuySignals } from "./telegram.js";
import { BuyDecisionEngine } from "./buyDecisionEngine.js";
import { schedule, SignalScheduler } from "./scheduler.js";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const rollups = new Rollups();
const TOK_INFO = new Map<string, { 
  name?: string; 
  symbol?: string; 
  desc?: string;
  analyzedAt?: string;
  detectedAt?: string;
}>();
const SCORES = new Map<string, { 
  tech: number; 
  meta: number; 
  total: number; 
  label: string;
  metaScore?: number;
  reason?: string;
  riskLevel?: string;
  riskScore?: number;
  riskFlags?: string[];
  risk?: string[];
  analyzedAt?: string;
}>();

// Make variables globally accessible for Telegram bot
(globalThis as any).ROLLUPS = rollups;
(globalThis as any).TOK_INFO = TOK_INFO;
(globalThis as any).SCORES = SCORES;

connectPumpPortal(cfg.apiKey, async (msg: any) => {
  // Handle subscription confirmations and errors
  if (msg.message) {
    console.log(`[${new Date().toISOString()}] 📢 PumpPortal:`, msg.message);
    return;
  }
  
  if (msg.errors) {
    console.error(`[${new Date().toISOString()}] ⚠️ PumpPortal Error:`, msg.errors);
    return;
  }
  
  // Handle actual data messages
  console.log("📡 Data received:", JSON.stringify(msg, null, 2));
  
  // Handle new token events - these are actually token creation events from PumpPortal
  if (msg.txType === "create" && msg.mint) {
    const m = msg;
    console.log("🆕 New token detected:", m.name, m.symbol, m.mint);
    TOK_INFO.set(m.mint, { 
      name: m.name, 
      symbol: m.symbol, 
      desc: m.uri,
      detectedAt: new Date().toISOString()
    });
    
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
    
    // Analyze risk
    const risk = analyzeRisk({
      initialBuy: m.initialBuy,
      solAmount: m.solAmount,
      buyers: mockStats.buyers,
      sellers: mockStats.sellers,
      uniqBuyers: mockStats.uniqBuyers,
      marketCap: m.marketCapSol,
      name: m.name,
      symbol: m.symbol
    });
    
    const total = totalScore(tech.score, meta.metaScore);
    
    // Make buy decision using the engine
    try {
      const buyDecision = await buyDecisionEngine.makeBuyDecision(
        {
          total,
          tech: tech.score,
          meta: meta.metaScore,
          metaScore: meta.metaScore,
          label: meta.label,
          risk: risk.flags,
          analyzedAt: new Date().toISOString()
        },
        null, // No DexScreener data available at token creation
        null  // No market conditions data
      );
      
      if (buyDecision.shouldBuy) {
        console.log(`🚀 BUY SIGNAL: ${m.symbol} - Confidence: ${buyDecision.confidence}%`);
        console.log(`💰 Suggested amount: ${buyDecision.suggestedAmount} SOL`);
        console.log(`📊 Reasons: ${buyDecision.reasons.join(', ')}`);
        
        // Send buy signal to Telegram
        if (cfg.telegramChatId) {
          await bot.sendMessage(cfg.telegramChatId, 
            `🚀 **AUTOMATED BUY SIGNAL**\n\n` +
            `**Token:** ${m.name} (${m.symbol})\n` +
            `**Confidence:** ${buyDecision.confidence}%\n` +
            `**Risk Level:** ${buyDecision.riskLevel}\n` +
            `**Suggested Amount:** ${buyDecision.suggestedAmount} SOL\n` +
            `**Stop Loss:** ${buyDecision.stopLoss}%\n` +
            `**Take Profit:** ${buyDecision.takeProfit}%\n\n` +
            `**Analysis:**\n${buyDecision.reasons.join('\n')}\n\n` +
            `**Address:** \`${m.mint}\`\n\n` +
            `⚠️ *Automated signal - DYOR before trading*`,
            { parse_mode: 'Markdown' }
          );
        }
      }
    } catch (buyError) {
      console.log(`❌ Buy decision error for ${m.symbol}:`, buyError);
    }

    SCORES.set(m.mint, { 
      tech: tech.score,
      meta: meta.metaScore,
      total,
      label: meta.label,
      metaScore: meta.metaScore,
      reason: meta.reason,
      riskLevel: risk.riskLevel,
      riskScore: risk.score,
      riskFlags: risk.flags,
      analyzedAt: new Date().toISOString()
    });
    
    // Update analyzedAt timestamp
    const tokenInfo = TOK_INFO.get(m.mint);
    if (tokenInfo) {
      TOK_INFO.set(m.mint, { 
        ...tokenInfo, 
        analyzedAt: new Date().toISOString() 
      });
    }
    
    const riskEmoji = getRiskEmoji(risk.riskLevel);
    console.log(`📊 Token scored: ${m.name || "Unknown"} | Score: ${total} | Meta: ${meta.label} | Risk: ${riskEmoji} ${risk.riskLevel}`);
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
    SCORES.set(t.mint, { 
      tech: tech.score, 
      meta: meta.metaScore, 
      total, 
      label: meta.label,
      metaScore: meta.metaScore,
      reason: meta.reason
    });
    
    // Update analyzedAt timestamp
    const tokenInfo = TOK_INFO.get(t.mint);
    if (tokenInfo) {
      TOK_INFO.set(t.mint, { 
        ...tokenInfo, 
        analyzedAt: new Date().toISOString() 
      });
    }
    
    console.log("📊 Token scored:", info.name || "Unknown", "Score:", total, "Meta:", meta.label);
  }
});

// hourly digest
const bot = makeBot(cfg.telegramToken);

// Setup interactive menu and commands
setupBotCommands(bot);

// Initialize signal scheduler for automated tasks
const signalScheduler = new SignalScheduler(bot);
signalScheduler.start();

// Initialize buy decision engine
const buyDecisionEngine = new BuyDecisionEngine({
  minAIScore: 70,
  minMetaScore: 60,
  minLiquidity: 15000,
  maxMarketCap: 2000000,
  minVolume24h: 10000,
  maxPairAge: 48,
  minTransactions: 30,
  riskTolerance: 'moderate',
  maxInvestmentPerToken: 0.5 // 0.5 SOL max per token
});

async function makeFeedAndNotify() {
  const mints = Array.from(SCORES.keys());
  
  // Remove duplicates by symbol (keep highest score)
  const uniqueTokens = new Map<string, any>();
  mints.forEach(mint => {
    const s = SCORES.get(mint)!;
    const info = TOK_INFO.get(mint) || {};
    const symbol = info.symbol || mint.slice(0, 8);
    
    const existing = uniqueTokens.get(symbol);
    if (!existing || s.total > existing.totalScore) {
      uniqueTokens.set(symbol, {
        mint,
        name: info.name,
        symbol: info.symbol,
        totalScore: s.total,
        label: s.label,
        techScore: s.tech,
        metaScore: s.metaScore || s.meta
      });
    }
  });
  
  const tokens = Array.from(uniqueTokens.values())
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, cfg.topTokensLimit);

  // Calculate metas from ALL tokens, not just top ones
  const byMeta = new Map<string, { count: number; sum: number; tokens: Set<string> }>();
  Array.from(SCORES.entries()).forEach(([mint, s]) => {
    const cur = byMeta.get(s.label) || { count: 0, sum: 0, tokens: new Set() };
    const info = TOK_INFO.get(mint);
    const symbol = info?.symbol || mint.slice(0, 8);
    
    // Only count unique symbols
    if (!cur.tokens.has(symbol)) {
      cur.count += 1;
      cur.sum += s.total;
      cur.tokens.add(symbol);
      byMeta.set(s.label, cur);
    }
  });
  
  const metas = Array.from(byMeta.entries())
    .map(([label, v]) => ({ 
      label, 
      count: v.count, 
      avgScore: Math.round(v.sum / v.count) 
    }))
    .filter(m => m.label !== 'unknown' || m.count >= 3) // Filter out weak unknowns
    .sort((a, b) => {
      // Sort by score, then by count
      if (Math.abs(b.avgScore - a.avgScore) > 5) return b.avgScore - a.avgScore;
      return b.count - a.count;
    })
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

// Schedule hourly buy signals with filters
schedule("0 * * * *", async () => { 
  if (cfg.telegramChatId) {
    await sendBuySignals(bot, cfg.telegramChatId);
  }
});
// Run first buy signal after 60s warmup
setTimeout(() => { 
  if (cfg.telegramChatId) {
    sendBuySignals(bot, cfg.telegramChatId).catch(() => {}); 
  }
}, 60_000);

console.log("MetaPulse AI Bot is live: hourly digests & buy signals enabled.");

// Create HTTP server for API endpoints
const server = http.createServer(async (req, res) => {
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
      tokens: Array.from(TOK_INFO.entries()).map(([address, info]) => {
        const scoreData = SCORES.get(address);
        return {
          address,
          ...info,
          score: scoreData?.total || 0,
          techScore: scoreData?.tech || 0,
          metaScore: scoreData?.metaScore || 0,
          category: scoreData?.label || 'unknown',
          reason: scoreData?.reason || '',
          riskLevel: scoreData?.riskLevel,
          riskScore: scoreData?.riskScore,
          riskFlags: scoreData?.riskFlags,
          detectedAt: info.detectedAt,
          analyzedAt: info.analyzedAt
        };
      }).sort((a, b) => {
        // Sort by most recent first
        const timeA = new Date(a.detectedAt || 0).getTime();
        const timeB = new Date(b.detectedAt || 0).getTime();
        return timeB - timeA;
      }).slice(0, 100), // Last 100 tokens
      metas: Array.from(SCORES.values()).reduce((acc, score) => {
        const category = score.label;
        if (!acc[category]) {
          acc[category] = { count: 0, avgScore: 0, totalScore: 0, avgMetaScore: 0, totalMetaScore: 0 };
        }
        acc[category].count++;
        acc[category].totalScore += score.total;
        acc[category].avgScore = acc[category].totalScore / acc[category].count;
        acc[category].totalMetaScore += (score.metaScore || 0);
        acc[category].avgMetaScore = acc[category].totalMetaScore / acc[category].count;
        return acc;
      }, {} as Record<string, { count: number; avgScore: number; totalScore: number; avgMetaScore: number; totalMetaScore: number }>),
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
  
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy',
      message: 'MetaPulse AI Bot is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      tokens: TOK_INFO.size,
      scores: SCORES.size
    }));
    return;
  }
  
  if (req.url === '/api/test-buy-signals' && req.method === 'POST') {
    try {
      console.log('🧪 Testing buy signals manually...');
      await sendBuySignals(bot, cfg.telegramChatId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'success',
        message: 'Buy signals test triggered',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ Error testing buy signals:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'error',
        message: 'Failed to trigger buy signals',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
    return;
  }
  
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const BOT_PORT = process.env.BOT_PORT || 3001;
server.listen(BOT_PORT, () => {
  console.log(`🤖 Bot HTTP server running on port ${BOT_PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   - https://www.metapulse.tech/api/feed`);
  console.log(`   - https://www.metapulse.tech/api/status`);
  console.log(`   - https://www.metapulse.tech/api/health`);
});

// Graceful shutdown for Railway
let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n🛑 ${signal} received, shutting down gracefully...`);
  
  try {
    // Stop accepting new connections
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
    
    // Give existing requests 10s to complete
    setTimeout(() => {
      console.log('⚠️  Forcing shutdown after timeout');
      process.exit(0);
    }, 10000);
    
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
  shutdown('UNHANDLED_REJECTION');
});
