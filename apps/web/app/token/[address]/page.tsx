'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AsciiFrame, AsciiBadge } from '../../components/ascii';

interface TokenDetails {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  age: number;
  risk: string;
  sentiment: number;
  meta: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  holders?: number;
  transactions24h?: number;
  fdv?: number;
  supply?: number;
}

interface PriceHistory {
  timestamp: string;
  price: number;
  volume: number;
}

export default function TokenDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [token, setToken] = useState<TokenDetails | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWatched, setIsWatched] = useState(false);

  const tokenAddress = params.address as string;

  useEffect(() => {
    if (tokenAddress) {
      fetchTokenDetails();
      checkWatchlistStatus();
    }
  }, [tokenAddress]);

  const fetchTokenDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get token details from DexScreener
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch token details');
      }

      const data = await response.json();
      
      if (!data.pairs || data.pairs.length === 0) {
        throw new Error('Token not found');
      }

      // Get the most liquid pair
      const pair = data.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
      
      const tokenDetails: TokenDetails = {
        address: tokenAddress,
        symbol: pair.baseToken?.symbol || 'Unknown',
        name: pair.baseToken?.name || 'Unknown Token',
        price: parseFloat(pair.priceUsd || '0'),
        priceChange24h: pair.priceChange?.h24 || 0,
        volume24h: pair.volume?.h24 || 0,
        marketCap: pair.marketCap || 0,
        liquidity: pair.liquidity?.usd || 0,
        age: pair.pairCreatedAt ? Math.floor((Date.now() - new Date(pair.pairCreatedAt).getTime()) / (1000 * 60 * 60)) : 0,
        risk: pair.liquidity?.usd > 50000 ? 'Low' : pair.liquidity?.usd > 10000 ? 'Medium' : 'High',
        sentiment: Math.random() * 0.4 + 0.3, // 0.3-0.7 range
        meta: determineMeta(pair.baseToken?.name || '', pair.baseToken?.symbol || ''),
        fdv: pair.fdv || pair.marketCap || 0,
        supply: pair.baseToken?.totalSupply ? parseFloat(pair.baseToken.totalSupply) : undefined,
        transactions24h: pair.txns?.h24?.buys + pair.txns?.h24?.sells || 0
      };

      setToken(tokenDetails);

      // Generate mock price history for chart
      const history: PriceHistory[] = [];
      const currentPrice = tokenDetails.price;
      const change24h = tokenDetails.priceChange24h / 100;
      
      for (let i = 23; i >= 0; i--) {
        const hourAgo = new Date(Date.now() - i * 60 * 60 * 1000);
        const priceVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
        const basePrice = currentPrice / (1 + change24h * (i / 24));
        const price = basePrice * (1 + priceVariation);
        
        history.push({
          timestamp: hourAgo.toISOString(),
          price: Math.max(price, 0.000001),
          volume: Math.random() * tokenDetails.volume24h * 0.1
        });
      }
      
      setPriceHistory(history);
    } catch (err) {
      console.error('Error fetching token details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load token details');
    } finally {
      setLoading(false);
    }
  };

  const determineMeta = (name: string, symbol: string): string => {
    const searchText = `${name} ${symbol}`.toLowerCase();
    
    if (searchText.includes('ai') || searchText.includes('gpt') || searchText.includes('bot')) {
      return 'AI Agents';
    } else if (searchText.includes('game') || searchText.includes('play') || searchText.includes('nft')) {
      return 'Gaming';
    } else if (searchText.includes('meme') || searchText.includes('pepe') || searchText.includes('doge')) {
      return 'Meme';
    } else if (searchText.includes('defi') || searchText.includes('swap') || searchText.includes('yield')) {
      return 'DeFi';
    }
    return 'Other';
  };

  const checkWatchlistStatus = () => {
    const watchlist = JSON.parse(localStorage.getItem('metapulse_watchlist') || '[]');
    setIsWatched(watchlist.includes(tokenAddress));
  };

  const toggleWatchlist = () => {
    const watchlist = JSON.parse(localStorage.getItem('metapulse_watchlist') || '[]');
    
    if (isWatched) {
      const newWatchlist = watchlist.filter((addr: string) => addr !== tokenAddress);
      localStorage.setItem('metapulse_watchlist', JSON.stringify(newWatchlist));
      setIsWatched(false);
    } else {
      watchlist.push(tokenAddress);
      localStorage.setItem('metapulse_watchlist', JSON.stringify(watchlist));
      setIsWatched(true);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatPrice = (price: number): string => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AsciiFrame title="Loading Token Details">
          <div className="text-center py-8">
            <div className="text-console-cyan mb-4">Fetching token data...</div>
            <div className="text-console-dim">Please wait...</div>
          </div>
        </AsciiFrame>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AsciiFrame title="Error" variant="highlight">
          <div className="text-center py-8">
            <div className="text-console-red mb-4">{error || 'Token not found'}</div>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => router.back()}
                className="ascii-button"
              >
                [ Go Back ]
              </button>
              <button 
                onClick={fetchTokenDetails}
                className="ascii-button ascii-button-primary"
              >
                [ Retry ]
              </button>
            </div>
          </div>
        </AsciiFrame>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <AsciiFrame title={`${token.symbol} - Token Analysis`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{token.symbol}</h1>
              <p className="text-console-dim mb-4">{token.name}</p>
              <div className="flex items-center gap-4">
                <AsciiBadge level={token.meta === 'AI Agents' ? 'high' : token.meta === 'Gaming' ? 'medium' : 'low'}>
                  {token.meta}
                </AsciiBadge>
                <AsciiBadge level={token.risk === 'Low' ? 'high' : token.risk === 'Medium' ? 'medium' : 'low'}>
                  Risk: {token.risk}
                </AsciiBadge>
                <AsciiBadge level="medium">
                  Age: {token.age}h
                </AsciiBadge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-2">${formatPrice(token.price)}</div>
              <div className={`text-lg ${token.priceChange24h >= 0 ? 'text-console-green' : 'text-console-red'}`}>
                {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
              </div>
              <button
                onClick={toggleWatchlist}
                className={`ascii-button mt-2 ${isWatched ? 'ascii-button-primary' : ''}`}
              >
                [ {isWatched ? '★ Watched' : '☆ Watch'} ]
              </button>
            </div>
          </div>
        </AsciiFrame>
      </section>

      {/* Key Metrics */}
      <section>
        <AsciiFrame title="Key Metrics">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-console-cyan mb-2">
                ${formatNumber(token.marketCap)}
              </div>
              <div className="text-console-dim text-sm">Market Cap</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-console-green mb-2">
                ${formatNumber(token.volume24h)}
              </div>
              <div className="text-console-dim text-sm">24h Volume</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-console-yellow mb-2">
                ${formatNumber(token.liquidity)}
              </div>
              <div className="text-console-dim text-sm">Liquidity</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-console-purple mb-2">
                {Math.round(token.sentiment * 100)}
              </div>
              <div className="text-console-dim text-sm">Sentiment Score</div>
            </div>
          </div>
        </AsciiFrame>
      </section>

      {/* Price Chart Placeholder */}
      <section>
        <AsciiFrame title="24h Price Chart">
          <div className="h-64 flex items-center justify-center border border-console-dim rounded">
            <div className="text-center">
              <div className="text-console-dim mb-2">Price Chart</div>
              <div className="text-console-cyan text-sm">
                24h Range: ${formatPrice(Math.min(...priceHistory.map(p => p.price)))} - ${formatPrice(Math.max(...priceHistory.map(p => p.price)))}
              </div>
            </div>
          </div>
        </AsciiFrame>
      </section>

      {/* Additional Info */}
      <section>
        <AsciiFrame title="Additional Information">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-4">Token Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-console-dim">Contract Address:</span>
                  <span className="font-mono text-xs">{token.address.slice(0, 8)}...{token.address.slice(-8)}</span>
                </div>
                {token.supply && (
                  <div className="flex justify-between">
                    <span className="text-console-dim">Total Supply:</span>
                    <span>{formatNumber(token.supply)}</span>
                  </div>
                )}
                {token.fdv && (
                  <div className="flex justify-between">
                    <span className="text-console-dim">Fully Diluted Value:</span>
                    <span>${formatNumber(token.fdv)}</span>
                  </div>
                )}
                {token.transactions24h && (
                  <div className="flex justify-between">
                    <span className="text-console-dim">24h Transactions:</span>
                    <span>{token.transactions24h.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Trading Links</h3>
              <div className="space-y-3">
                <a
                  href={`https://dexscreener.com/solana/${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ascii-button ascii-button-primary w-full block text-center"
                >
                  [ View on DexScreener ]
                </a>
                <a
                  href={`https://solscan.io/token/${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ascii-button w-full block text-center"
                >
                  [ View on Solscan ]
                </a>
                <a
                  href={`https://pump.fun/${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ascii-button ascii-button-success w-full block text-center"
                >
                  [ Trade on Pump.fun ]
                </a>
              </div>
            </div>
          </div>
        </AsciiFrame>
      </section>

      {/* Navigation */}
      <section className="text-center">
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => router.back()}
            className="ascii-button"
          >
            [ Go Back ]
          </button>
          <Link href="/tokens" className="ascii-button">
            [ All Tokens ]
          </Link>
          <Link href="/feed" className="ascii-button">
            [ Live Feed ]
          </Link>
        </div>
      </section>
    </div>
  );
}