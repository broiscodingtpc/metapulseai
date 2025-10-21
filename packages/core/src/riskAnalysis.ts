export interface RiskAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  score: number; // 0-100, lower is riskier
  flags: string[];
  warnings: string[];
  signals: {
    liquidity: 'good' | 'medium' | 'low';
    distribution: 'healthy' | 'concerning' | 'centralized';
    activity: 'organic' | 'suspicious' | 'bot-driven';
  };
}

export function analyzeRisk(data: {
  initialBuy?: number;
  solAmount?: number;
  buyers?: number;
  sellers?: number;
  uniqBuyers?: number;
  marketCap?: number;
  name?: string;
  symbol?: string;
}): RiskAnalysis {
  const flags: string[] = [];
  const warnings: string[] = [];
  let riskScore = 100; // Start at safe

  // 1. Liquidity Analysis
  const solAmount = data.solAmount || 0;
  let liquiditySignal: 'good' | 'medium' | 'low' = 'good';
  
  if (solAmount < 0.1) {
    riskScore -= 30;
    flags.push('🚨 Very low initial buy');
    liquiditySignal = 'low';
  } else if (solAmount < 0.5) {
    riskScore -= 15;
    warnings.push('⚠️ Low liquidity');
    liquiditySignal = 'medium';
  } else if (solAmount >= 5) {
    warnings.push('🐋 Whale entry - watch for dumps');
  }

  // 2. Distribution Analysis
  const buyers = data.buyers || 0;
  const uniqBuyers = data.uniqBuyers || 0;
  let distributionSignal: 'healthy' | 'concerning' | 'centralized' = 'healthy';
  
  if (uniqBuyers === 0) {
    riskScore -= 40;
    flags.push('🚨 No buyers - dead token');
    distributionSignal = 'centralized';
  } else if (uniqBuyers === 1) {
    riskScore -= 25;
    flags.push('⚠️ Single buyer - highly centralized');
    distributionSignal = 'centralized';
  } else if (uniqBuyers < 5) {
    riskScore -= 10;
    warnings.push('⚠️ Few buyers - low distribution');
    distributionSignal = 'concerning';
  }

  // 3. Activity Analysis
  const sellers = data.sellers || 0;
  let activitySignal: 'organic' | 'suspicious' | 'bot-driven' = 'organic';
  
  if (buyers > 0 && sellers === 0) {
    // All buying, no selling - could be organic or bot
    if (uniqBuyers >= 5) {
      warnings.push('🎯 Strong buying - no sellers yet');
    } else {
      riskScore -= 15;
      warnings.push('⚠️ Suspicious pattern - bots possible');
      activitySignal = 'suspicious';
    }
  } else if (sellers > buyers * 2) {
    riskScore -= 20;
    flags.push('📉 Heavy selling pressure');
  }

  // 4. Name/Symbol Red Flags
  const name = (data.name || '').toLowerCase();
  const symbol = (data.symbol || '').toLowerCase();
  
  const spamWords = ['test', 'sample', 'xxx', 'scam', 'rug', 'moon', 'safe'];
  const hasSpam = spamWords.some(word => name.includes(word) || symbol.includes(word));
  
  if (hasSpam) {
    riskScore -= 25;
    flags.push('🚩 Spam keywords detected');
    activitySignal = 'bot-driven';
  }
  
  if (symbol.length > 10) {
    riskScore -= 10;
    warnings.push('⚠️ Unusually long symbol');
  }

  // 5. Market Cap Analysis
  const marketCap = data.marketCap || 0;
  if (marketCap < 10) {
    warnings.push('💧 Very low market cap - high volatility');
  } else if (marketCap > 1000) {
    warnings.push('📈 Established market cap');
  }

  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  if (riskScore >= 70) riskLevel = 'LOW';
  else if (riskScore >= 50) riskLevel = 'MEDIUM';
  else if (riskScore >= 30) riskLevel = 'HIGH';
  else riskLevel = 'EXTREME';

  return {
    riskLevel,
    score: Math.max(0, Math.min(100, riskScore)),
    flags,
    warnings,
    signals: {
      liquidity: liquiditySignal,
      distribution: distributionSignal,
      activity: activitySignal
    }
  };
}

export function getRiskEmoji(level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'): string {
  switch (level) {
    case 'LOW': return '🟢';
    case 'MEDIUM': return '🟡';
    case 'HIGH': return '🟠';
    case 'EXTREME': return '🔴';
  }
}

