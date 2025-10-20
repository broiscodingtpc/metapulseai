export type Snapshot = {
  mint: string;
  name?: string;
  symbol?: string;
  desc?: string;
  buyers1m: number;
  sellers1m: number;
  uniqBuyers1m: number;
  priceImpact01?: number;
};

export function techScore(s: Snapshot, cfg: {
  minUniqueBuyers: number;
  maxImpactPct: number;
  minBuyerSeller: number;
}) {
  const reasons: string[] = [];
  let score = 0;

  if (s.uniqBuyers1m >= cfg.minUniqueBuyers) { score += 25; reasons.push("unique buyers ok"); }
  if (s.buyers1m > 0) {
    const ratio = s.buyers1m / Math.max(1, s.sellers1m);
    if (ratio >= cfg.minBuyerSeller) { score += 25; reasons.push("buy pressure ok"); }
  }
  if (typeof s.priceImpact01 === "number") {
    if (s.priceImpact01 <= cfg.maxImpactPct) { score += 25; reasons.push("impact acceptable"); }
  } else {
    score += 10; reasons.push("impact unknown");
  }
  // lightweight hygiene bonus
  if (s.name && s.symbol && s.symbol.length <= 6) { score += 10; reasons.push("naming clean"); }

  return { score: Math.min(100, score), reasons };
}

export function totalScore(tech: number, meta: number) {
  return Math.round(0.6 * tech + 0.4 * meta);
}
