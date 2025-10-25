import { NextResponse } from 'next/server';

interface SentimentData {
  token: string;
  symbol: string;
  overallSentiment: number;
  socialVolume: number;
  sources: {
    twitter: { sentiment: number; mentions: number };
    reddit: { sentiment: number; mentions: number };
    telegram: { sentiment: number; mentions: number };
    discord: { sentiment: number; mentions: number };
  };
  keywords: string[];
  trendingScore: number;
  lastUpdated: Date;
}

// Simple sentiment analysis using keyword matching
function analyzeSentimentFromText(text: string): number {
  const positiveWords = [
    'bullish', 'moon', 'pump', 'gem', 'buy', 'hold', 'diamond', 'rocket',
    'green', 'profit', 'gains', 'up', 'rise', 'surge', 'breakout', 'golden',
    'amazing', 'great', 'excellent', 'fantastic', 'awesome', 'love', 'best',
    'strong', 'solid', 'potential', 'opportunity', 'winner', 'success'
  ];

  const negativeWords = [
    'bearish', 'dump', 'sell', 'crash', 'red', 'loss', 'down', 'fall',
    'drop', 'decline', 'weak', 'bad', 'terrible', 'awful', 'hate', 'worst',
    'scam', 'rug', 'dead', 'failed', 'disaster', 'avoid', 'danger', 'risk'
  ];

  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });

  const totalSentimentWords = positiveCount + negativeCount;
  if (totalSentimentWords === 0) return 0.5; // Neutral

  return positiveCount / totalSentimentWords;
}

// Extract trending keywords from text
function extractKeywords(text: string): string[] {
  const commonKeywords = [
    'bullish', 'bearish', 'moon', 'pump', 'dump', 'gem', 'buy', 'sell',
    'hold', 'diamond', 'hands', 'rocket', 'green', 'red', 'profit', 'loss',
    'gains', 'dip', 'breakout', 'support', 'resistance', 'volume', 'liquidity'
  ];

  const words = text.toLowerCase().split(/\s+/);
  const foundKeywords = words.filter(word => commonKeywords.includes(word));
  
  // Count frequency and return top keywords
  const keywordCount: { [key: string]: number } = {};
  foundKeywords.forEach(keyword => {
    keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
  });

  return Object.entries(keywordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([keyword]) => keyword);
}

interface SocialPlatformData {
  mentions: number;
  sentiment: number;
  text: string;
}

interface SocialMediaData {
  twitter: SocialPlatformData;
  reddit: SocialPlatformData;
  telegram: SocialPlatformData;
  discord: SocialPlatformData;
}

// Simulate social media data fetching
async function fetchSocialMediaData(token: string): Promise<SocialMediaData> {
  // In a real implementation, this would call various social media APIs
  // For now, we'll simulate the data based on the token name
  
  const baseVolume = Math.floor(Math.random() * 5000) + 1000;
  const sentiment = 0.3 + Math.random() * 0.5; // 0.3 to 0.8
  
  return {
    twitter: {
      mentions: Math.floor(baseVolume * 0.4),
      sentiment: sentiment + (Math.random() - 0.5) * 0.2,
      text: `${token} looking bullish today! Great potential for gains. Diamond hands! 🚀`
    },
    reddit: {
      mentions: Math.floor(baseVolume * 0.3),
      sentiment: sentiment + (Math.random() - 0.5) * 0.2,
      text: `Just bought more ${token}. This gem is going to moon soon. HODL strong!`
    },
    telegram: {
      mentions: Math.floor(baseVolume * 0.2),
      sentiment: sentiment + (Math.random() - 0.5) * 0.2,
      text: `${token} community is growing fast. Buy the dip while you can!`
    },
    discord: {
      mentions: Math.floor(baseVolume * 0.1),
      sentiment: sentiment + (Math.random() - 0.5) * 0.2,
      text: `${token} technical analysis looks promising. Breakout incoming!`
    }
  };
}

async function analyzeSentimentForToken(token: string, symbol: string): Promise<SentimentData> {
  try {
    const socialData = await fetchSocialMediaData(token);
    
    // Analyze sentiment for each platform
    const sources = {
      twitter: {
        sentiment: Math.max(0, Math.min(1, analyzeSentimentFromText(socialData.twitter.text))),
        mentions: socialData.twitter.mentions
      },
      reddit: {
        sentiment: Math.max(0, Math.min(1, analyzeSentimentFromText(socialData.reddit.text))),
        mentions: socialData.reddit.mentions
      },
      telegram: {
        sentiment: Math.max(0, Math.min(1, analyzeSentimentFromText(socialData.telegram.text))),
        mentions: socialData.telegram.mentions
      },
      discord: {
        sentiment: Math.max(0, Math.min(1, analyzeSentimentFromText(socialData.discord.text))),
        mentions: socialData.discord.mentions
      }
    };

    // Calculate overall sentiment (weighted by volume)
    const totalMentions = Object.values(sources).reduce((sum, source) => sum + source.mentions, 0);
    const weightedSentiment = Object.values(sources).reduce((sum, source) => {
      const weight = source.mentions / totalMentions;
      return sum + (source.sentiment * weight);
    }, 0);

    // Extract keywords from all text
    const allText = Object.values(socialData).map((data: SocialPlatformData) => data.text).join(' ');
    const keywords = extractKeywords(allText);

    // Calculate trending score based on volume and sentiment
    const trendingScore = Math.min(100, (totalMentions / 100) * (weightedSentiment * 100));

    return {
      token,
      symbol,
      overallSentiment: weightedSentiment,
      socialVolume: totalMentions,
      sources,
      keywords,
      trendingScore,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error(`Error analyzing sentiment for ${token}:`, error);
    
    // Return default data on error
    return {
      token,
      symbol,
      overallSentiment: 0.5,
      socialVolume: 0,
      sources: {
        twitter: { sentiment: 0.5, mentions: 0 },
        reddit: { sentiment: 0.5, mentions: 0 },
        telegram: { sentiment: 0.5, mentions: 0 },
        discord: { sentiment: 0.5, mentions: 0 }
      },
      keywords: [],
      trendingScore: 0,
      lastUpdated: new Date()
    };
  }
}

export async function GET() {
  try {
    // Get trending tokens from our API
    const tokensResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tokens/trending`);
    let tokens = [];
    
    if (tokensResponse.ok) {
      const tokensData = await tokensResponse.json();
      tokens = tokensData.slice(0, 10); // Top 10 tokens
    } else {
      // Fallback tokens for demo
      tokens = [
        { name: 'PulseAI', symbol: 'PULSE' },
        { name: 'MetaBot', symbol: 'MBOT' },
        { name: 'CryptoGPT', symbol: 'CGPT' },
        { name: 'AITrader', symbol: 'AITRD' },
        { name: 'SmartDEX', symbol: 'SDEX' }
      ];
    }

    // Analyze sentiment for each token
    const sentimentPromises = tokens.map((token: any) => 
      analyzeSentimentForToken(token.name, token.symbol)
    );

    const sentimentData = await Promise.all(sentimentPromises);

    // Sort by trending score
    sentimentData.sort((a, b) => b.trendingScore - a.trendingScore);

    return NextResponse.json(sentimentData);
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    
    // Return sample data as fallback
    const sampleData: SentimentData[] = [
      {
        token: 'PulseAI',
        symbol: 'PULSE',
        overallSentiment: 0.78,
        socialVolume: 4250,
        sources: {
          twitter: { sentiment: 0.82, mentions: 1700 },
          reddit: { sentiment: 0.75, mentions: 1275 },
          telegram: { sentiment: 0.80, mentions: 850 },
          discord: { sentiment: 0.73, mentions: 425 }
        },
        keywords: ['bullish', 'moon', 'gem', 'buy', 'potential'],
        trendingScore: 89.5,
        lastUpdated: new Date()
      },
      {
        token: 'MetaBot',
        symbol: 'MBOT',
        overallSentiment: 0.65,
        socialVolume: 3100,
        sources: {
          twitter: { sentiment: 0.68, mentions: 1240 },
          reddit: { sentiment: 0.62, mentions: 930 },
          telegram: { sentiment: 0.67, mentions: 620 },
          discord: { sentiment: 0.61, mentions: 310 }
        },
        keywords: ['hold', 'diamond', 'hands', 'strong', 'potential'],
        trendingScore: 72.3,
        lastUpdated: new Date()
      }
    ];
    
    return NextResponse.json(sampleData);
  }
}