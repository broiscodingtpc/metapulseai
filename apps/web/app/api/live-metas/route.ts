import { NextResponse } from 'next/server';
import { rateLimiter } from '@metapulse/core';

interface TokenData {
  symbol: string;
  name: string;
  address: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  score: number;
}

interface LiveMeta {
  id: string;
  category: string;
  trending: boolean;
  tokens: TokenData[];
  performance: {
    avgGain: number;
    topGainer: string;
    totalVolume: number;
    activeTokens: number;
  };
  lastUpdate: string;
}

// Fetch real data from DexScreener and categorize by metas
async function fetchRealLiveMetas(): Promise<LiveMeta[]> {
  try {
    console.log('[LiveMetas API] Attempting to fetch from DexScreener...');
    
    // Try with rate limiter first
    let response;
    try {
      response = await rateLimiter.execute('dexscreener:search', async () => {
        return await fetch(
          'https://api.dexscreener.com/latest/dex/search?q=solana',
          {
            headers: {
              'User-Agent': 'MetaPulse-Bot/1.0',
            },
          }
        );
      });
    } catch (rateLimitError) {
      console.log('[LiveMetas API] Rate limiter failed, trying direct fetch...');
      // Direct fetch as fallback
      response = await fetch(
        'https://api.dexscreener.com/latest/dex/search?q=solana',
        {
          headers: {
            'User-Agent': 'MetaPulse-Bot/1.0',
          },
        }
      );
    }

    console.log('[LiveMetas API] DexScreener response:', {
      ok: response.ok,
      status: response.status
    });

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }

    const data = await response.json();
    const pairs = data.pairs || [];
    
    console.log('[LiveMetas API] Received pairs:', pairs.length);

    // Filter for valid Solana pairs with liquidity
    const validPairs = pairs.filter((pair: any) => 
      pair.chainId === 'solana' && 
      pair.liquidity?.usd > 1000 &&
      pair.baseToken?.name &&
      pair.baseToken?.symbol
    );
    
    console.log('[LiveMetas API] Valid pairs after filtering:', validPairs.length);

    // Categorize tokens by meta keywords
    const metaCategories = {
      'AI Agents': ['ai', 'agent', 'gpt', 'bot', 'neural', 'smart', 'brain'],
      'Gaming': ['game', 'play', 'nft', 'meta', 'verse', 'pixel', 'war'],
      'Meme Coins': ['pepe', 'doge', 'shib', 'meme', 'frog', 'cat', 'dog'],
      'DeFi': ['defi', 'swap', 'yield', 'farm', 'stake', 'pool', 'finance'],
      'Celebrity': ['trump', 'elon', 'celebrity', 'famous', 'star'],
      'Seasonal': ['christmas', 'halloween', 'winter', 'summer', 'holiday'],
      'Art & NFT': ['art', 'nft', 'pixel', 'draw', 'paint', 'creative'],
      'Sports': ['sport', 'football', 'soccer', 'basketball', 'tennis']
    };

    const categorizedTokens: { [key: string]: any[] } = {};
    
    // Initialize categories
    Object.keys(metaCategories).forEach(category => {
      categorizedTokens[category] = [];
    });

    // Categorize each token
    validPairs.forEach((pair: any) => {
      const tokenName = (pair.baseToken?.name || '').toLowerCase();
      const tokenSymbol = (pair.baseToken?.symbol || '').toLowerCase();
      const searchText = `${tokenName} ${tokenSymbol}`;

      let categorized = false;
      Object.entries(metaCategories).forEach(([category, keywords]) => {
        if (!categorized && keywords.some(keyword => searchText.includes(keyword))) {
          categorizedTokens[category].push(pair);
          categorized = true;
        }
      });

      // If not categorized, add to a general category based on volume
      if (!categorized && pair.volume?.h24 > 10000) {
        categorizedTokens['Meme Coins'].push(pair);
      }
    });

    console.log('[LiveMetas API] Categories created:', Object.keys(categorizedTokens).map(cat => 
      `${cat}: ${categorizedTokens[cat].length} tokens`
    ));

    // Convert to LiveMeta format
    const result = Object.entries(categorizedTokens)
      .filter(([_, tokens]) => tokens.length > 0)
      .map(([category, tokens], index) => {
        const processedTokens: TokenData[] = tokens
          .slice(0, 10) // Limit to top 10 tokens per category
          .map((pair: any) => ({
            symbol: pair.baseToken?.symbol || 'UNK',
            name: pair.baseToken?.name || 'Unknown',
            address: pair.baseToken?.address || '',
            price: parseFloat(pair.priceUsd || '0'),
            change24h: pair.priceChange?.h24 || 0,
            volume24h: pair.volume?.h24 || 0,
            marketCap: pair.marketCap || 0,
            score: Math.min(100, Math.max(0, 
              (pair.priceChange?.h24 || 0) + 
              Math.log10((pair.volume?.h24 || 1) / 1000) * 10
            ))
          }))
          .sort((a, b) => b.score - a.score);

        const avgGain = processedTokens.length > 0 
          ? processedTokens.reduce((sum, t) => sum + t.change24h, 0) / processedTokens.length 
          : 0;
        
        const topGainer = processedTokens.length > 0 
          ? processedTokens.reduce((top, current) => 
              current.change24h > top.change24h ? current : top
            )
          : null;
        
        const totalVolume = processedTokens.reduce((sum, t) => sum + t.volume24h, 0);
        const trending = avgGain > 10 && totalVolume > 100000;

        return {
          id: `meta-${index}`,
          category,
          trending,
          tokens: processedTokens,
          performance: {
            avgGain: Math.round(avgGain * 100) / 100,
            topGainer: topGainer?.symbol || 'N/A',
            totalVolume,
            activeTokens: processedTokens.length
          },
          lastUpdate: new Date().toISOString()
        };
      });
      
    console.log('[LiveMetas API] Final result:', result.length, 'categories with data');
    return result;
  } catch (error) {
    console.error('[LiveMetas API] Error fetching real live metas:', error);
    console.error('[LiveMetas API] FALLING BACK TO MOCK DATA');
    return generateMockLiveMetas();
  }
}

// Fallback mock data generator
function generateMockLiveMetas(): LiveMeta[] {
  const categories = [
    { name: 'AI Agents', trending: true, baseScore: 85, icon: '🤖' },
    { name: 'Gaming', trending: true, baseScore: 78, icon: '🎮' },
    { name: 'Meme Coins', trending: false, baseScore: 72, icon: '😂' },
    { name: 'DeFi', trending: false, baseScore: 68, icon: '💰' },
    { name: 'Celebrity', trending: true, baseScore: 82, icon: '⭐' },
    { name: 'Seasonal', trending: false, baseScore: 65, icon: '🎃' },
    { name: 'Art & NFT', trending: false, baseScore: 70, icon: '🎨' },
    { name: 'Sports', trending: true, baseScore: 75, icon: '⚽' }
  ];

  return categories.map((cat, index) => {
    const tokenCount = Math.floor(Math.random() * 8) + 3; // 3-10 tokens per meta
    const tokens: TokenData[] = Array.from({ length: tokenCount }, (_, i) => {
      const basePrice = Math.random() * 0.01 + 0.0001;
      const change = (Math.random() - 0.3) * 200; // Bias towards positive
      
      return {
        symbol: `${cat.name.slice(0, 3).toUpperCase()}${i + 1}`,
        name: `${cat.name} Token ${i + 1}`,
        address: `${Math.random().toString(36).substring(2, 15)}pump`,
        price: basePrice,
        change24h: change,
        volume24h: Math.random() * 500000 + 50000,
        marketCap: Math.random() * 10000000 + 1000000,
        score: cat.baseScore + Math.floor(Math.random() * 20) - 10
      };
    }).sort((a, b) => b.score - a.score);

    const avgGain = tokens.reduce((sum, t) => sum + t.change24h, 0) / tokens.length;
    const topGainer = tokens.reduce((top, current) => 
      current.change24h > top.change24h ? current : top
    );
    const totalVolume = tokens.reduce((sum, t) => sum + t.volume24h, 0);

    return {
      id: `meta-${index}`,
      category: cat.name,
      trending: cat.trending,
      tokens,
      performance: {
        avgGain: Math.round(avgGain * 100) / 100,
        topGainer: topGainer.symbol,
        totalVolume,
        activeTokens: tokens.length
      },
      lastUpdate: new Date().toISOString()
    };
  });
}

export async function GET() {
  try {
    // Fetch real data from DexScreener
    const metas = await fetchRealLiveMetas();
    
    return NextResponse.json({
      success: true,
      data: metas,
      timestamp: new Date().toISOString(),
      count: metas.length
    });
  } catch (error) {
    console.error('Error fetching live metas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch live metas',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, maxTokens = 10 } = body;
    
    // Generate specific meta data if category is provided
    let metas = await fetchRealLiveMetas();
    
    if (category) {
      metas = metas.filter(meta => 
        meta.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    // Limit tokens per meta if specified
    metas = metas.map(meta => ({
      ...meta,
      tokens: meta.tokens.slice(0, maxTokens)
    }));
    
    return NextResponse.json({
      success: true,
      data: metas,
      timestamp: new Date().toISOString(),
      filters: { category, maxTokens }
    });
  } catch (error) {
    console.error('Error processing live metas request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process live metas request',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}