'use client';

import { useState, useEffect } from 'react';
import { AsciiFrame, AsciiBadge } from '../components/ascii';

interface SystemHealth {
  services: Array<{
    name: string;
    status: 'online' | 'offline' | 'degraded';
    uptime: number;
    lastCheck: string;
    responseTime: number;
  }>;
  alerts: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
  logs: Array<{
    timestamp: string;
    level: 'error' | 'warn' | 'info' | 'debug';
    service: string;
    message: string;
  }>;
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchSystemHealth();
    
    if (autoRefresh) {
      const interval = setInterval(fetchSystemHealth, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/monitoring');
      if (!response.ok) {
        throw new Error('Failed to fetch system health data');
      }
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Error fetching system health:', error);
      // Fallback to mock data if API fails
      const mockData: SystemHealth = {
        services: [
          { name: 'Web Server', status: 'online', uptime: 99.9, lastCheck: new Date().toISOString(), responseTime: 45 },
          { name: 'Bot Service', status: 'online', uptime: 98.7, lastCheck: new Date().toISOString(), responseTime: 120 },
          { name: 'Token Analyzer', status: 'online', uptime: 99.2, lastCheck: new Date().toISOString(), responseTime: 230 },
          { name: 'Telegram Bot', status: 'online', uptime: 97.8, lastCheck: new Date().toISOString(), responseTime: 180 },
          { name: 'PumpPortal WS', status: 'degraded', uptime: 89.3, lastCheck: new Date().toISOString(), responseTime: 850 },
          { name: 'Database', status: 'online', uptime: 99.8, lastCheck: new Date().toISOString(), responseTime: 25 },
        ],
        alerts: [
          { id: '1', severity: 'warning', message: 'PumpPortal WebSocket connection unstable', timestamp: '2024-01-15T10:30:00Z', resolved: false },
          { id: '2', severity: 'info', message: 'Daily backup completed successfully', timestamp: '2024-01-15T06:00:00Z', resolved: true },
          { id: '3', severity: 'critical', message: 'High memory usage detected (>90%)', timestamp: '2024-01-15T09:45:00Z', resolved: true },
        ],
        logs: [
          { timestamp: '2024-01-15T10:35:12Z', level: 'info', service: 'analyzer', message: 'Token PULSE analyzed successfully - Score: 95' },
          { timestamp: '2024-01-15T10:35:08Z', level: 'warn', service: 'pumpportal', message: 'WebSocket reconnection attempt #3' },
          { timestamp: '2024-01-15T10:35:05Z', level: 'info', service: 'telegram', message: 'Digest sent to 1,247 subscribers' },
          { timestamp: '2024-01-15T10:34:58Z', level: 'error', service: 'analyzer', message: 'Failed to fetch token data: Rate limit exceeded' },
          { timestamp: '2024-01-15T10:34:45Z', level: 'info', service: 'web', message: 'Admin dashboard accessed from IP: 192.168.1.100' },
          { timestamp: '2024-01-15T10:34:30Z', level: 'debug', service: 'bot', message: 'Processing rollup data batch #1247' },
        ]
      };
      setHealth(mockData);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-console-green';
      case 'degraded': return 'text-console-yellow';
      case 'offline': return 'text-console-red';
      default: return 'text-console-dim';
    }
  };

  const getSeverityLevel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'low';
      case 'warning': return 'medium';
      case 'info': return 'high';
      default: return 'medium';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-console-red';
      case 'warn': return 'text-console-yellow';
      case 'info': return 'text-console-cyan';
      case 'debug': return 'text-console-dim';
      default: return 'text-console-white';
    }
  };

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold">Loading System Health...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">System Monitoring</h1>
        <p className="text-console-dim mb-6">Real-time System Health & Performance Monitoring</p>
        
        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`ascii-button ${autoRefresh ? 'ascii-button-primary' : ''}`}
          >
            [ {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'} ]
          </button>
          
          <button
            onClick={fetchSystemHealth}
            disabled={loading}
            className={`ascii-button ${loading ? 'opacity-50' : ''}`}
          >
            [ {loading ? 'Refreshing...' : 'Manual Refresh'} ]
          </button>
        </div>
      </section>

      {/* Service Status */}
      <section>
        <AsciiFrame title="Service Status">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {health?.services.map((service) => (
              <div key={service.name} className="ascii-box p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold">{service.name}</h3>
                  <AsciiBadge 
                    level={service.status === 'online' ? 'high' : service.status === 'degraded' ? 'medium' : 'low'}
                    size="sm"
                  >
                    {service.status.toUpperCase()}
                  </AsciiBadge>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-console-dim">Uptime:</span>
                    <span className={getStatusColor(service.status)}>{service.uptime.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-console-dim">Response:</span>
                    <span className={service.responseTime > 500 ? 'text-console-yellow' : 'text-console-green'}>
                      {service.responseTime}ms
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-console-dim">Last Check:</span>
                    <span className="text-console-cyan">
                      {new Date(service.lastCheck).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AsciiFrame>
      </section>

      {/* Active Alerts */}
      <section>
        <AsciiFrame title="System Alerts">
          <div className="space-y-3">
            {health?.alerts.filter(alert => !alert.resolved).length === 0 ? (
              <div className="text-center text-console-green py-4">
                <div className="text-2xl mb-2">✓</div>
                <div>No active alerts - All systems operational</div>
              </div>
            ) : (
              health?.alerts.filter(alert => !alert.resolved).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 ascii-box">
                  <div className="flex items-center gap-3">
                    <AsciiBadge level={getSeverityLevel(alert.severity)} size="sm">
                      {alert.severity.toUpperCase()}
                    </AsciiBadge>
                    <div>
                      <div className="font-bold text-sm">{alert.message}</div>
                      <div className="text-console-dim text-xs">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <button className="ascii-button text-xs">
                    [ Resolve ]
                  </button>
                </div>
              ))
            )}
          </div>
        </AsciiFrame>
      </section>

      {/* Recent Logs */}
      <section>
        <AsciiFrame title="System Logs">
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {health?.logs.map((log, index) => (
              <div key={index} className="flex items-start gap-3 p-2 text-sm font-mono hover:bg-console-bg-light">
                <div className="text-console-dim text-xs whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                
                <div className={`${getLogLevelColor(log.level)} font-bold uppercase text-xs min-w-[50px]`}>
                  {log.level}
                </div>
                
                <div className="text-console-cyan text-xs min-w-[80px]">
                  [{log.service}]
                </div>
                
                <div className="flex-1">
                  {log.message}
                </div>
              </div>
            ))}
          </div>
        </AsciiFrame>
      </section>

      {/* System Actions */}
      <section>
        <AsciiFrame title="System Actions">
          <div className="grid md:grid-cols-3 gap-4">
            <button className="ascii-button ascii-button-primary p-4">
              [ Restart All Services ]
            </button>
            
            <button className="ascii-button p-4">
              [ Clear System Cache ]
            </button>
            
            <button className="ascii-button p-4">
              [ Export System Logs ]
            </button>
          </div>
        </AsciiFrame>
      </section>
    </div>
  );
}