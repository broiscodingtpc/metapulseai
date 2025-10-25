// Force load .env manually
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// Load .env from project root (go up 2 levels from apps/bot)
const envPath = resolve(process.cwd(), '../../.env');
console.log("🔧 Loading .env from:", envPath);
const result = dotenvConfig({ path: envPath });
console.log("🔧 .env loaded:", result.error ? "❌ Error: " + result.error : "✅ Success");

export const cfg = {
  apiKey: process.env.PUMPPORTAL_API_KEY,
  telegramToken: process.env.TELEGRAM_BOT_TOKEN!,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  cron: process.env.DIGEST_CRON || "0 * * * *",
  rollupWindowSec: Number(process.env.ROLLUP_WINDOW_SEC || 3600),
  topTokensLimit: Number(process.env.TOP_TOKENS_LIMIT || 10),
  topMetasLimit: Number(process.env.TOP_METAS_LIMIT || 5),
  minUniqueBuyers: Number(process.env.MIN_UNIQUE_BUYERS || 4),
  maxImpactPct: Number(process.env.MAX_PRICE_IMPACT_01 || 25),
  minBuyerSeller: Number(process.env.MIN_BUYER_SELLER_RATIO || 1.1),
  llmKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  llmModel: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp" // Default model
};

// Debug logging
console.log("🔧 Config loaded:");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY ? "✅ Set" : "❌ Missing");
console.log("GEMINI_MODEL:", process.env.GEMINI_MODEL || "⚠️ Using default: gemini-2.0-flash-exp");
console.log("Final llmModel:", cfg.llmModel);
