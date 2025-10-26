'use client';

import { useState, useEffect } from 'react';
import { AsciiFrame, AsciiTable, AsciiBadge } from '../components/ascii';

interface PortfolioToken {
  symbol: string;
  address: string;
  amount: number;
  avgBuyPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
  lastUpdated: string;
}

interface PortfolioStats {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  totalInvested: number;
  bestPerformer: string;
  worstPerformer: string;
  dayChange: number;
  dayChangePercent: number;
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioToken[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddToken, setShowAddToken] = useState(false);
  const [newToken, setNewToken] = useState({
    symbol: '',
    address: '',
    amount: '',
    buyPrice: ''
  });

  useEffect(() => {
    loadPortfolio();
    const interval = setInterval(updatePrices, 30000); // Update prices every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPortfolio = () => {
    try {
      const savedPortfolio = localStorage.getItem('metapulse_portfolio');
      if (savedPortfolio) {
        const portfolioData = JSON.parse(savedPortfolio);
        setPortfolio(portfolioData);
        updatePrices(portfolioData);
      } else {
        // Initialize with sample portfolio for demo
        const samplePortfolio: PortfolioToken[] = [
          {
            symbol: 'SOL',
            address: 'So11111111111111111111111111111111111111112',
            amount: 10.5,
            avgBuyPrice: 85.20,
            currentPrice: 95.50,
            value: 1002.75,
            pnl: 108.15,
            pnlPercent: 12.09,
            allocation: 45.2,
            lastUpdated: new Date().toISOString()
          },
          {
            symbol: 'BONK',
            address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
            amount: 1000000,
            avgBuyPrice: 0.000028,
            currentPrice: 0.000025,
            value: 25.00,
            pnl: -3.00,
            pnlPercent: -10.71,
            allocation: 1.1,
            lastUpdated: new Date().toISOString()
          },
          {
            symbol: 'WIF',
            address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
            amount: 150,
            avgBuyPrice: 2.10,
            currentPrice: 2.85,
            value: 427.50,
            pnl: 112.50,
            pnlPercent: 35.71,
            allocation: 19.3,
            lastUpdated: new Date().toISOString()
          },
          {
            symbol: 'PEPE',
            address: '6GCLwUJfUjeUgkgvKHFP5z9Nq8VWbVkNYJzKHhzwqe5v',
            amount: 50000000,
            avgBuyPrice: 0.00001100,
            currentPrice: 0.00001234,
            value: 617.00,
            pnl: 67.00,
            pnlPercent: 12.18,
            allocation: 27.8,
            lastUpdated: new Date().toISOString()
          }
        ];
        setPortfolio(samplePortfolio);
        localStorage.setItem('metapulse_portfolio', JSON.stringify(samplePortfolio));
        updatePrices(samplePortfolio);
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrices = async (portfolioData?: PortfolioToken[]) => {
    try {
      const currentPortfolio = portfolioData || portfolio;
      if (currentPortfolio.length === 0) return;

      // Fetch current prices from trending tokens API
      const response = await fetch('/api/tokens/trending');
      if (!response.ok) throw new Error('Failed to fetch prices');
      
      const data = await response.json();
      const tokens = data.tokens || [];
      
      const updatedPortfolio = currentPortfolio.map(token => {
        const marketData = tokens.find((t: any) => 
          t.symbol === token.symbol || t.address === token.address
        );
        
        if (marketData) {
          const currentPrice = marketData.price || token.currentPrice;
          const value = token.amount * currentPrice;
          const invested = token.amount * token.avgBuyPrice;
          const pnl = value - invested;
          const pnlPercent = (pnl / invested) * 100;
          
          return {
            ...token,
            currentPrice,
            value,
            pnl,
            pnlPercent,
            lastUpdated: new Date().toISOString()
          };
        }
        return token;
      });
      
      // Calculate portfolio stats
      const totalValue = updatedPortfolio.reduce((sum, token) => sum + token.value, 0);
      const totalInvested = updatedPortfolio.reduce((sum, token) => sum + (token.amount * token.avgBuyPrice), 0);
      const totalPnL = totalValue - totalInvested;
      const totalPnLPercent = (totalPnL / totalInvested) * 100;
      
      // Update allocations
      const portfolioWithAllocations = updatedPortfolio.map(token => ({
        ...token,
        allocation: (token.value / totalValue) * 100
      }));
      
      // Find best and worst performers
      const sortedByPnL = [...portfolioWithAllocations].sort((a, b) => b.pnlPercent - a.pnlPercent);
      const bestPerformer = sortedByPnL[0]?.symbol || '';
      const worstPerformer = sortedByPnL[sortedByPnL.length - 1]?.symbol || '';
      
      const portfolioStats: PortfolioStats = {
        totalValue,
        totalPnL,
        totalPnLPercent,
        totalInvested,
        bestPerformer,
        worstPerformer,
        dayChange: totalPnL * 0.1, // Simulate daily change
        dayChangePercent: totalPnLPercent * 0.1
      };
      
      setPortfolio(portfolioWithAllocations);
      setStats(portfolioStats);
      
      // Save updated portfolio
      localStorage.setItem('metapulse_portfolio', JSON.stringify(portfolioWithAllocations));
      
    } catch (error) {
      console.error('Error updating prices:', error);
    }
  };

  const addToken = async () => {
    if (!newToken.symbol || !newToken.amount || !newToken.buyPrice) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // Try to fetch token data
      const response = await fetch('/api/tokens/trending');
      const data = await response.json();
      const tokens = data.tokens || [];
      
      const tokenData = tokens.find((t: any) => 
        t.symbol.toLowerCase() === newToken.symbol.toLowerCase()
      );
      
      const amount = parseFloat(newToken.amount);
      const buyPrice = parseFloat(newToken.buyPrice);
      const currentPrice = tokenData?.price || buyPrice;
      const value = amount * currentPrice;
      const invested = amount * buyPrice;
      const pnl = value - invested;
      const pnlPercent = (pnl / invested) * 100;
      
      const portfolioToken: PortfolioToken = {
        symbol: newToken.symbol.toUpperCase(),
        address: tokenData?.address || newToken.address || `addr_${Date.now()}`,
        amount,
        avgBuyPrice: buyPrice,
        currentPrice,
        value,
        pnl,
        pnlPercent,
        allocation: 0, // Will be calculated in updatePrices
        lastUpdated: new Date().toISOString()
      };
      
      const updatedPortfolio = [...portfolio, portfolioToken];
      setPortfolio(updatedPortfolio);
      localStorage.setItem('metapulse_portfolio', JSON.stringify(updatedPortfolio));
      
      // Reset form
      setNewToken({ symbol: '', address: '', amount: '', buyPrice: '' });
      setShowAddToken(false);
      
      // Update prices and stats
      updatePrices(updatedPortfolio);
      
    } catch (error) {
      console.error('Error adding token:', error);
      alert('Error adding token. Please try again.');
    }
  };

  const removeToken = (address: string) => {
    const updatedPortfolio = portfolio.filter(token => token.address !== address);
    setPortfolio(updatedPortfolio);
    localStorage.setItem('metapulse_portfolio', JSON.stringify(updatedPortfolio));
    updatePrices(updatedPortfolio);
  };

  const formatPrice = (price: number): string => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const formatValue = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const portfolioTableData = portfolio.map(token => [
    token.symbol,
    token.amount.toLocaleString(),
    `$${formatPrice(token.avgBuyPrice)}`,
    `$${formatPrice(token.currentPrice)}`,
    formatValue(token.value),
    token.pnl >= 0 ? `+${formatValue(token.pnl)}` : formatValue(token.pnl),
    token.pnlPercent >= 0 ? `+${token.pnlPercent.toFixed(2)}%` : `${token.pnlPercent.toFixed(2)}%`,
    `${token.allocation.toFixed(1)}%`,
    <button 
      key={token.address}
      onClick={() => removeToken(token.address)}
      className="text-console-red hover:text-console-red-bright text-sm"
    >
      Remove
    </button>
  ]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AsciiFrame title="Portfolio Tracker">
          <div className="text-center py-8">
            <div className="text-console-cyan mb-2">Loading portfolio...</div>
          </div>
        </AsciiFrame>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Portfolio Stats */}
      {stats && (
        <AsciiFrame title="Portfolio Overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-console-dim text-sm">Total Value</div>
              <div className="text-2xl font-bold text-console-cyan">
                {formatValue(stats.totalValue)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-console-dim text-sm">Total P&L</div>
              <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-console-green' : 'text-console-red'}`}>
                {stats.totalPnL >= 0 ? '+' : ''}{formatValue(stats.totalPnL)}
              </div>
              <div className={`text-sm ${stats.totalPnLPercent >= 0 ? 'text-console-green' : 'text-console-red'}`}>
                {stats.totalPnLPercent >= 0 ? '+' : ''}{stats.totalPnLPercent.toFixed(2)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-console-dim text-sm">Best Performer</div>
              <div className="text-lg font-bold text-console-green">
                {stats.bestPerformer}
              </div>
            </div>
            <div className="text-center">
              <div className="text-console-dim text-sm">Worst Performer</div>
              <div className="text-lg font-bold text-console-red">
                {stats.worstPerformer}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-console-dim">
              Total Invested: {formatValue(stats.totalInvested)}
            </div>
            <button 
              onClick={() => setShowAddToken(!showAddToken)}
              className="ascii-button ascii-button-primary"
            >
              [ Add Token ]
            </button>
          </div>
        </AsciiFrame>
      )}

      {/* Add Token Form */}
      {showAddToken && (
        <AsciiFrame title="Add Token to Portfolio">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Symbol (e.g., SOL)"
              value={newToken.symbol}
              onChange={(e) => setNewToken({...newToken, symbol: e.target.value})}
              className="ascii-input"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newToken.amount}
              onChange={(e) => setNewToken({...newToken, amount: e.target.value})}
              className="ascii-input"
            />
            <input
              type="number"
              placeholder="Buy Price"
              step="0.000001"
              value={newToken.buyPrice}
              onChange={(e) => setNewToken({...newToken, buyPrice: e.target.value})}
              className="ascii-input"
            />
            <div className="flex gap-2">
              <button onClick={addToken} className="ascii-button ascii-button-primary flex-1">
                Add
              </button>
              <button 
                onClick={() => setShowAddToken(false)} 
                className="ascii-button ascii-button-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </AsciiFrame>
      )}

      {/* Portfolio Table */}
      <AsciiFrame title="Holdings">
        {portfolio.length > 0 ? (
          <AsciiTable
            columns={[
              { key: 'token', header: 'Token' },
              { key: 'amount', header: 'Amount' },
              { key: 'avgBuy', header: 'Avg Buy' },
              { key: 'current', header: 'Current' },
              { key: 'value', header: 'Value' },
              { key: 'pnl', header: 'P&L' },
              { key: 'pnlPercent', header: 'P&L %' },
              { key: 'allocation', header: 'Allocation' },
              { key: 'action', header: 'Action' }
            ]}
            data={portfolioTableData}
          />
        ) : (
          <div className="text-center py-8">
            <div className="text-console-dim mb-4">No tokens in portfolio</div>
            <button 
              onClick={() => setShowAddToken(true)}
              className="ascii-button ascii-button-primary"
            >
              [ Add Your First Token ]
            </button>
          </div>
        )}
      </AsciiFrame>

      {/* Refresh Button */}
      <div className="text-center">
        <button 
          onClick={() => updatePrices()}
          className="ascii-button ascii-button-secondary"
        >
          [ Refresh Prices ]
        </button>
      </div>
    </div>
  );
}