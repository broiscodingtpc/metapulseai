import { NextRequest, NextResponse } from 'next/server';

interface TwitterMention {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
  score?: number;
}

interface TwitterSentiment {
  token: string;
  mentions: number;
  sentiment: number; // -1 to 1
  engagement: number;
  trending: boolean;
  recent_mentions: TwitterMention[];
  sentiment_breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

// Simple sentiment analysis function
function analyzeSentiment(text: string): { sentiment: 'positive' | 'negative' | 'neutral', score: number } {
  const positiveWords = ['bullish', 'moon', 'pump', 'buy', 'hold', 'gem', 'rocket', 'up', 'gain', 'profit', 'win', 'good', 'great', 'amazing', 'love', 'best'];
  const negativeWords = ['bearish', 'dump', 'sell', 'crash', 'down', 'loss', 'lose', 'bad', 'terrible', 'hate', 'worst', 'scam', 'rug', 'dead'];
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 1;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 1;
  });
  
  // Normalize score
  const normalizedScore = Math.max(-1, Math.min(1, score * 0.2));
  
  if (normalizedScore > 0.1) return { sentiment: 'positive', score: normalizedScore };
  if (normalizedScore < -0.1) return { sentiment: 'negative', score: normalizedScore };
  return { sentiment: 'neutral', score: normalizedScore };
}

// Generate realistic Twitter mentions for a token
function generateTwitterMentions(tokenSymbol: string, count: number = 10): TwitterMention[] {
  const mentions: TwitterMention[] = [];
  const now = new Date();
  
  const sampleTexts = [
    `$${tokenSymbol} looking bullish today! 🚀`,
    `Just bought more $${tokenSymbol}, this is going to moon`,
    `$${tokenSymbol} chart looking good, might be a gem`,
    `Anyone else watching $${tokenSymbol}? Thoughts?`,
    `$${tokenSymbol} volume is picking up, interesting`,
    `Sold my $${tokenSymbol} bag, not feeling it anymore`,
    `$${tokenSymbol} dump incoming? Chart looks bearish`,
    `$${tokenSymbol} community is strong, holding long term`,
    `New to $${tokenSymbol}, what's the story here?`,
    `$${tokenSymbol} partnership announcement when?`,
    `$${tokenSymbol} to the moon! 🌙`,
    `$${tokenSymbol} is dead, moving on`,
    `$${tokenSymbol} best investment this year`,
    `$${tokenSymbol} rug pull incoming, be careful`,
    `$${tokenSymbol} fundamentals are solid`
  ];
  
  for (let i = 0; i < count; i++) {
    const text = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    const sentiment = analyzeSentiment(text);
    const createdAt = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000); // Random time in last 24h
    
    mentions.push({
      id: `${Date.now()}_${i}`,
      text,
      author_id: `user_${Math.floor(Math.random() * 10000)}`,
      created_at: createdAt.toISOString(),
      public_metrics: {
        retweet_count: Math.floor(Math.random() * 50),
        like_count: Math.floor(Math.random() * 200),
        reply_count: Math.floor(Math.random() * 30),
        quote_count: Math.floor(Math.random() * 10)
      },
      sentiment: sentiment.sentiment,
      score: sentiment.score
    });
  }
  
  return mentions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'Token parameter is required' }, { status: 400 });
    }

    // In a real implementation, you would use Twitter API v2
    // For now, we'll generate realistic mock data based on the token
    
    const mentions = generateTwitterMentions(token, 15);
    const totalMentions = mentions.length;
    
    // Calculate sentiment breakdown
    const sentimentBreakdown = mentions.reduce((acc, mention) => {
      if (mention.sentiment) {
        acc[mention.sentiment]++;
      }
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });
    
    // Calculate overall sentiment score
    const overallSentiment = mentions.reduce((sum, mention) => sum + (mention.score || 0), 0) / mentions.length;
    
    // Calculate engagement score
    const totalEngagement = mentions.reduce((sum, mention) => {
      return sum + mention.public_metrics.like_count + mention.public_metrics.retweet_count + mention.public_metrics.reply_count;
    }, 0);
    
    const avgEngagement = totalEngagement / mentions.length;
    const engagementScore = Math.min(1, avgEngagement / 100); // Normalize to 0-1
    
    // Determine if trending (high mentions + positive sentiment + high engagement)
    const isTrending = totalMentions > 10 && overallSentiment > 0.2 && engagementScore > 0.3;
    
    const twitterSentiment: TwitterSentiment = {
      token: token.toUpperCase(),
      mentions: totalMentions,
      sentiment: overallSentiment,
      engagement: engagementScore,
      trending: isTrending,
      recent_mentions: mentions.slice(0, 10), // Return top 10 most recent
      sentiment_breakdown: sentimentBreakdown
    };

    return NextResponse.json(twitterSentiment);
  } catch (error) {
    console.error('Error fetching Twitter sentiment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Twitter sentiment data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokens } = body;
    
    if (!tokens || !Array.isArray(tokens)) {
      return NextResponse.json({ error: 'Tokens array is required' }, { status: 400 });
    }

    // Batch process multiple tokens
    const results: TwitterSentiment[] = [];
    
    for (const token of tokens.slice(0, 10)) { // Limit to 10 tokens
      const mentions = generateTwitterMentions(token, 8);
      const totalMentions = mentions.length;
      
      const sentimentBreakdown = mentions.reduce((acc, mention) => {
        if (mention.sentiment) {
          acc[mention.sentiment]++;
        }
        return acc;
      }, { positive: 0, negative: 0, neutral: 0 });
      
      const overallSentiment = mentions.reduce((sum, mention) => sum + (mention.score || 0), 0) / mentions.length;
      
      const totalEngagement = mentions.reduce((sum, mention) => {
        return sum + mention.public_metrics.like_count + mention.public_metrics.retweet_count;
      }, 0);
      
      const avgEngagement = totalEngagement / mentions.length;
      const engagementScore = Math.min(1, avgEngagement / 100);
      
      const isTrending = totalMentions > 6 && overallSentiment > 0.1 && engagementScore > 0.2;
      
      results.push({
        token: token.toUpperCase(),
        mentions: totalMentions,
        sentiment: overallSentiment,
        engagement: engagementScore,
        trending: isTrending,
        recent_mentions: mentions.slice(0, 5),
        sentiment_breakdown: sentimentBreakdown
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error processing batch Twitter sentiment:', error);
    return NextResponse.json(
      { error: 'Failed to process batch Twitter sentiment data' },
      { status: 500 }
    );
  }
}