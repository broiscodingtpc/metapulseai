export type Snapshot = {
  mint: string;
  name?: string;
  symbol?: string;
  desc?: string;
  buyers1m: number;
  sellers1m: number;
  uniqBuyers1m: number;
  priceImpact01?: number;
  initialBuy?: number;
  solAmount?: number;
  marketCap?: number;
};

export function techScore(s: Snapshot, cfg: {
  minUniqueBuyers: number;
  maxImpactPct: number;
  minBuyerSeller: number;
}) {
  const reasons: string[] = [];
  let score = 0;

  // 1. Unique Buyers (Strong organic interest)
  if (s.uniqBuyers1m >= cfg.minUniqueBuyers * 2) { 
    score += 30; 
    reasons.push("🔥 Strong community"); 
  } else if (s.uniqBuyers1m >= cfg.minUniqueBuyers) { 
    score += 20; 
    reasons.push("✅ Good buyers"); 
  }

  // 2. Buy Pressure (Buying momentum)
  if (s.buyers1m > 0) {
    const ratio = s.buyers1m / Math.max(1, s.sellers1m);
    if (ratio >= cfg.minBuyerSeller * 2) { 
      score += 30; 
      reasons.push("🚀 High buy pressure"); 
    } else if (ratio >= cfg.minBuyerSeller) { 
      score += 20; 
      reasons.push("📈 Positive momentum"); 
    }
  }

  // 3. Price Impact (Low impact = healthy liquidity)
  if (typeof s.priceImpact01 === "number") {
    if (s.priceImpact01 <= cfg.maxImpactPct / 2) { 
      score += 20; 
      reasons.push("💎 Excellent liquidity"); 
    } else if (s.priceImpact01 <= cfg.maxImpactPct) { 
      score += 15; 
      reasons.push("💧 Good liquidity"); 
    }
  } else {
    score += 5; 
    reasons.push("⚠️ Liquidity unknown");
  }

  // 4. Initial Buy Quality (Whale or retail?)
  if (s.initialBuy && s.solAmount) {
    const buySize = s.solAmount;
    if (buySize >= 5) {
      score += 15;
      reasons.push("🐋 Whale entry");
    } else if (buySize >= 1) {
      score += 10;
      reasons.push("💰 Strong entry");
    } else if (buySize >= 0.1) {
      score += 5;
      reasons.push("✓ Retail entry");
    }
  }

  // 5. Token Quality (Professional naming)
  if (s.name && s.symbol) {
    const hasCleanSymbol = s.symbol.length >= 2 && s.symbol.length <= 6;
    const hasCleanName = s.name.length >= 3 && s.name.length <= 30;
    const noSpam = !s.name.toLowerCase().includes('test') && 
                   !s.symbol.toLowerCase().includes('test');
    
    if (hasCleanSymbol && hasCleanName && noSpam) { 
      score += 10; 
      reasons.push("✨ Professional"); 
    } else if (hasCleanSymbol && hasCleanName) {
      score += 5;
      reasons.push("⚡ Clean naming");
    }
  }

  return { score: Math.min(100, score), reasons };
}

export function totalScore(tech: number, meta: number) {
  // Weight: 50% tech, 50% meta for balanced analysis
  return Math.round(0.5 * tech + 0.5 * meta);
}
