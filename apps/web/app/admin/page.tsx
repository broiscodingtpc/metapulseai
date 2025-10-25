'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AsciiFrame, AsciiBadge } from '../components/ascii';

interface AnalyzerStats {
  isRunning: boolean;
  processedTokensCount: number;
  uptime: number;
}

interface TestResult {
  success: boolean;
  service?: string;
  results?: Record<string, any>;
  data?: any;
  message?: string;
  error?: string;
}

interface BotStats {
  isRunning: boolean;
  totalTokensAnalyzed: number;
  activeMetas: number;
  lastActivity: string;
  connectionStatus: string;
  telegramBot: string;
  pumpPortalConnection: string;
  rollupStats: {
    processed: number;
    pending: number;
    errors: number;
  };
}

export default function AdminPage() {
  const [stats, setStats] = useState<AnalyzerStats | null>(null);
  const [botStats, setBotStats] = useState<BotStats | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [manualMint, setManualMint] = useState('');

  const handleLogout = () => {
    document.cookie = 'admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    window.location.href = '/admin/login';
  };

  useEffect(() => {
    fetchStats();
    fetchBotStats();
    const interval = setInterval(() => {
      fetchStats();
      fetchBotStats();
    }, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/analyzer');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchBotStats = async () => {
    try {
      const response = await fetch('/api/bot');
      const data = await response.json();
      if (data.success) {
        setBotStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching bot stats:', error);
    }
  };

  const handleAnalyzerAction = async (action: string) => {
    setLoading(prev => ({ ...prev, [action]: true }));
    
    try {
      const response = await fetch('/api/analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const data = await response.json();
      setTestResults(prev => ({ ...prev, [action]: data }));
      
      // Refresh stats after action
      setTimeout(fetchStats, 1000);
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [action]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const handleManualAnalysis = async () => {
    if (!manualMint.trim()) return;
    
    setLoading(prev => ({ ...prev, manual: true }));
    
    try {
      const response = await fetch('/api/analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', mint: manualMint.trim() })
      });
      
      const data = await response.json();
      setTestResults(prev => ({ ...prev, manual: data }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        manual: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, manual: false }));
    }
  };

  const testAPI = async (apiName: string) => {
    setLoading(prev => ({ ...prev, [apiName]: true }));
    
    try {
      const response = await fetch(`/api/test?test=${apiName}`);
      const data = await response.json();
      setTestResults(prev => ({ ...prev, [apiName]: data }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [apiName]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [apiName]: false }));
    }
  };

  const handleBotAction = async (action: string) => {
    setLoading(prev => ({ ...prev, [`bot-${action}`]: true }));
    
    try {
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const data = await response.json();
      setTestResults(prev => ({ ...prev, [`bot-${action}`]: data }));
      
      // Refresh bot stats after action
      setTimeout(fetchBotStats, 1000);
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [`bot-${action}`]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [`bot-${action}`]: false }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="text-center">
        <div className="flex justify-between items-center mb-4">
          <div></div>
          <h1 className="text-4xl font-bold">MetaPulse AI Admin</h1>
          <button 
            onClick={handleLogout}
            className="ascii-button text-red-400 hover:text-red-300"
          >
            [ LOGOUT ]
          </button>
        </div>
        <p className="text-console-dim mb-6">System Control & Monitoring Dashboard</p>
      </section>

      {/* Navigation */}
      <section className="text-center">
        <div className="flex justify-center gap-4">
          <Link href="/" className="ascii-button">
            [ Back to Home ]
          </Link>
          <Link href="/analytics" className="ascii-button">
            [ Analytics ]
          </Link>
          <Link href="/monitoring" className="ascii-button">
            [ System Monitor ]
          </Link>
          <Link href="/feed" className="ascii-button">
            [ Live Feed ]
          </Link>
        </div>
      </section>

      {/* System Status */}
      <section>
        <AsciiFrame title="System Status">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                <AsciiBadge level={stats?.isRunning ? 'high' : 'low'}>
                  {stats?.isRunning ? 'RUNNING' : 'STOPPED'}
                </AsciiBadge>
              </div>
              <div className="text-console-dim text-sm">Analyzer Status</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                <AsciiBadge level={botStats?.isRunning ? 'high' : 'low'}>
                  {botStats?.isRunning ? 'ACTIVE' : 'INACTIVE'}
                </AsciiBadge>
              </div>
              <div className="text-console-dim text-sm">Bot Status</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-console-cyan mb-2">
                {stats?.processedTokensCount || 0}
              </div>
              <div className="text-console-dim text-sm">Tokens Processed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-console-yellow mb-2">
                {botStats?.activeMetas || 0}
              </div>
              <div className="text-console-dim text-sm">Active Metas</div>
            </div>
          </div>
        </AsciiFrame>
      </section>

      {/* Bot Status Details */}
      <section>
        <AsciiFrame title="Bot Status Details">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-lg font-bold mb-2">
                <AsciiBadge level={botStats?.telegramBot === 'Active' ? 'high' : 'low'} size="sm">
                  {botStats?.telegramBot || 'Unknown'}
                </AsciiBadge>
              </div>
              <div className="text-console-dim text-sm">Telegram Bot</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold mb-2">
                <AsciiBadge level={botStats?.pumpPortalConnection === 'Connected' ? 'high' : 'low'} size="sm">
                  {botStats?.pumpPortalConnection || 'Unknown'}
                </AsciiBadge>
              </div>
              <div className="text-console-dim text-sm">PumpPortal</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-console-green mb-2">
                {botStats?.totalTokensAnalyzed || 0}
              </div>
              <div className="text-console-dim text-sm">Total Analyzed</div>
            </div>
          </div>
          
          {botStats?.rollupStats && (
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-console-cyan">
                  {botStats.rollupStats.processed}
                </div>
                <div className="text-console-dim text-xs">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-console-yellow">
                  {botStats.rollupStats.pending}
                </div>
                <div className="text-console-dim text-xs">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-console-red">
                  {botStats.rollupStats.errors}
                </div>
                <div className="text-console-dim text-xs">Errors</div>
              </div>
            </div>
          )}
        </AsciiFrame>
      </section>

      {/* Bot Controls */}
      <section>
        <AsciiFrame title="Bot Controls">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleBotAction('start')}
              disabled={loading['bot-start'] || botStats?.isRunning}
              className={`ascii-button ascii-button-primary w-full ${
                (loading['bot-start'] || botStats?.isRunning) ? 'opacity-50' : ''
              }`}
            >
              [ {loading['bot-start'] ? 'Starting...' : 'Start Bot'} ]
            </button>
            
            <button
              onClick={() => handleBotAction('stop')}
              disabled={loading['bot-stop'] || !botStats?.isRunning}
              className={`ascii-button ascii-button-danger w-full ${
                (loading['bot-stop'] || !botStats?.isRunning) ? 'opacity-50' : ''
              }`}
            >
              [ {loading['bot-stop'] ? 'Stopping...' : 'Stop Bot'} ]
            </button>
            
            <button
              onClick={() => handleBotAction('restart')}
              disabled={loading['bot-restart']}
              className={`ascii-button w-full ${loading['bot-restart'] ? 'opacity-50' : ''}`}
            >
              [ {loading['bot-restart'] ? 'Restarting...' : 'Restart Bot'} ]
            </button>
            
            <button
              onClick={() => handleBotAction('send-digest')}
              disabled={loading['bot-send-digest']}
              className={`ascii-button ascii-button-primary w-full ${loading['bot-send-digest'] ? 'opacity-50' : ''}`}
            >
              [ {loading['bot-send-digest'] ? 'Sending...' : 'Send Digest'} ]
            </button>
          </div>
          
          {/* Bot Action Results */}
          {Object.entries(testResults).filter(([key]) => 
            key.startsWith('bot-')
          ).map(([action, result]) => (
            <div key={action} className="mt-4 p-3 ascii-box">
              <div className="text-sm">
                <strong>{action.replace('bot-', '').toUpperCase()}:</strong>{' '}
                <AsciiBadge level={result.success ? 'high' : 'low'} size="sm">
                  {result.success ? 'SUCCESS' : 'ERROR'}
                </AsciiBadge>
              </div>
              {result.message && (
                <div className="text-console-dim text-xs mt-1">{result.message}</div>
              )}
              {result.error && (
                <div className="text-console-red text-xs mt-1">{result.error}</div>
              )}
            </div>
          ))}
        </AsciiFrame>
      </section>

      {/* Analyzer Controls */}
      <section>
        <AsciiFrame title="Analyzer Controls">
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => handleAnalyzerAction('start')}
              disabled={loading.start || stats?.isRunning}
              className={`ascii-button ascii-button-primary w-full ${
                (loading.start || stats?.isRunning) ? 'opacity-50' : ''
              }`}
            >
              [ {loading.start ? 'Starting...' : 'Start Analyzer'} ]
            </button>
            
            <button
              onClick={() => handleAnalyzerAction('stop')}
              disabled={loading.stop || !stats?.isRunning}
              className={`ascii-button ascii-button-danger w-full ${
                (loading.stop || !stats?.isRunning) ? 'opacity-50' : ''
              }`}
            >
              [ {loading.stop ? 'Stopping...' : 'Stop Analyzer'} ]
            </button>
            
            <button
              onClick={() => handleAnalyzerAction('clear-cache')}
              disabled={loading['clear-cache']}
              className={`ascii-button w-full ${loading['clear-cache'] ? 'opacity-50' : ''}`}
            >
              [ {loading['clear-cache'] ? 'Clearing...' : 'Clear Cache'} ]
            </button>
            
            <button
              onClick={fetchStats}
              className="ascii-button w-full"
            >
              [ Refresh Stats ]
            </button>
          </div>
          
          {/* Action Results */}
          {Object.entries(testResults).filter(([key]) => 
            ['start', 'stop', 'clear-cache'].includes(key)
          ).map(([action, result]) => (
            <div key={action} className="mt-4 p-3 ascii-box">
              <div className="text-sm">
                <strong>{action.toUpperCase()}:</strong>{' '}
                <AsciiBadge level={result.success ? 'high' : 'low'} size="sm">
                  {result.success ? 'SUCCESS' : 'ERROR'}
                </AsciiBadge>
              </div>
              {result.message && (
                <div className="text-console-dim text-xs mt-1">{result.message}</div>
              )}
              {result.error && (
                <div className="text-console-red text-xs mt-1">{result.error}</div>
              )}
            </div>
          ))}
        </AsciiFrame>
      </section>

      {/* Manual Token Analysis */}
      <section>
        <AsciiFrame title="Manual Token Analysis">
          <div className="space-y-4">
            <div>
              <label className="block text-console-fg font-bold mb-2">TOKEN MINT ADDRESS:</label>
              <input
                type="text"
                value={manualMint}
                onChange={(e) => setManualMint(e.target.value)}
                placeholder="Enter Solana token mint address..."
                className="ascii-input w-full"
              />
            </div>
            
            <button
              onClick={handleManualAnalysis}
              disabled={loading.manual || !manualMint.trim()}
              className={`ascii-button ascii-button-primary w-full ${
                (loading.manual || !manualMint.trim()) ? 'opacity-50' : ''
              }`}
            >
              [ {loading.manual ? 'Analyzing...' : 'Analyze Token'} ]
            </button>
            
            {testResults.manual && (
              <div className="p-3 ascii-box">
                <div className="text-sm mb-2">
                  <strong>ANALYSIS RESULT:</strong>{' '}
                  <AsciiBadge level={testResults.manual.success ? 'high' : 'low'} size="sm">
                    {testResults.manual.success ? 'SUCCESS' : 'ERROR'}
                  </AsciiBadge>
                </div>
                
                {testResults.manual.success && testResults.manual.data && (
                  <div className="text-xs space-y-1">
                    <div><strong>Symbol:</strong> {testResults.manual.data.symbol}</div>
                    <div><strong>Score:</strong> {testResults.manual.data.analysis?.score || 'N/A'}/100</div>
                    <div><strong>Category:</strong> {testResults.manual.data.analysis?.metaCategory || 'N/A'}</div>
                    <div><strong>Risk:</strong> {testResults.manual.data.analysis?.riskLevel || 'N/A'}</div>
                  </div>
                )}
                
                {testResults.manual.error && (
                  <div className="text-console-red text-xs">{testResults.manual.error}</div>
                )}
              </div>
            )}
          </div>
        </AsciiFrame>
      </section>

      {/* API Testing */}
      <section>
        <AsciiFrame title="API Testing">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['dexscreener', 'pumpportal', 'groq', 'telegram'].map(api => (
              <button
                key={api}
                onClick={() => testAPI(api)}
                disabled={loading[api]}
                className={`ascii-button w-full ${loading[api] ? 'opacity-50' : ''}`}
              >
                [ {loading[api] ? 'Testing...' : `Test ${api}`} ]
              </button>
            ))}
          </div>
          
          <button
            onClick={() => testAPI('all')}
            disabled={loading.all}
            className={`ascii-button ascii-button-primary w-full mt-4 ${
              loading.all ? 'opacity-50' : ''
            }`}
          >
            [ {loading.all ? 'Testing All...' : 'Test All APIs'} ]
          </button>
          
          {/* Test Results */}
          {Object.entries(testResults).filter(([key]) => 
            ['dexscreener', 'pumpportal', 'groq', 'telegram', 'all'].includes(key)
          ).map(([api, result]) => (
            <div key={api} className="mt-4 p-3 ascii-box">
              <div className="text-sm mb-2">
                <strong>{api.toUpperCase()}:</strong>{' '}
                <AsciiBadge level={result.success ? 'high' : 'low'} size="sm">
                  {result.success ? 'SUCCESS' : 'ERROR'}
                </AsciiBadge>
              </div>
              
              {result.results && (
                <div className="text-xs space-y-1">
                  {Object.entries(result.results).map(([service, status]: [string, any]) => (
                    <div key={service}>
                      <strong>{service}:</strong> {status.status} 
                      {status.count && ` (${status.count} items)`}
                      {status.score && ` (Score: ${status.score})`}
                    </div>
                  ))}
                </div>
              )}
              
              {result.error && (
                <div className="text-console-red text-xs">{result.error}</div>
              )}
            </div>
          ))}
        </AsciiFrame>
      </section>
    </div>
  );
}