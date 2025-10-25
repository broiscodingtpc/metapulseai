'use client';

import React, { useState, useEffect } from 'react';
import { AsciiFrame } from './ascii';

interface Notification {
  id: string;
  type: 'buy_signal' | 'price_alert' | 'meta_trend' | 'risk_warning' | 'market_update';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  actionUrl?: string;
}

interface NotificationSettings {
  buySignals: boolean;
  priceAlerts: boolean;
  metaTrends: boolean;
  riskWarnings: boolean;
  marketUpdates: boolean;
  minRiskLevel: 'low' | 'medium' | 'high';
  soundEnabled: boolean;
  emailEnabled: boolean;
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    buySignals: true,
    priceAlerts: true,
    metaTrends: true,
    riskWarnings: true,
    marketUpdates: false,
    minRiskLevel: 'medium',
    soundEnabled: true,
    emailEnabled: false
  });
  const [showSettings, setShowSettings] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load notifications from localStorage
    const savedNotifications = localStorage.getItem('metapulse_notifications');
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
      setNotifications(parsed);
      setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
    }

    // Load settings from localStorage
    const savedSettings = localStorage.getItem('metapulse_notification_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Set up periodic check for new notifications
    const interval = setInterval(checkForNewNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkForNewNotifications = async () => {
    try {
      // Check for buy signals
      if (settings.buySignals) {
        const response = await fetch('/api/notifications/check');
        if (response.ok) {
          const newNotifications = await response.json();
          if (newNotifications.length > 0) {
            addNotifications(newNotifications);
          }
        }
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const addNotifications = (newNotifications: Notification[]) => {
    const updatedNotifications = [...newNotifications, ...notifications].slice(0, 50); // Keep last 50
    setNotifications(updatedNotifications);
    setUnreadCount(prev => prev + newNotifications.length);
    
    // Save to localStorage
    localStorage.setItem('metapulse_notifications', JSON.stringify(updatedNotifications));
    
    // Play sound if enabled
    if (settings.soundEnabled && newNotifications.some(n => n.priority === 'high' || n.priority === 'critical')) {
      playNotificationSound();
    }
  };

  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    setUnreadCount(prev => Math.max(0, prev - 1));
    localStorage.setItem('metapulse_notifications', JSON.stringify(updatedNotifications));
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    localStorage.setItem('metapulse_notifications', JSON.stringify(updatedNotifications));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('metapulse_notifications');
  };

  const updateSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('metapulse_notification_settings', JSON.stringify(newSettings));
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'buy_signal': return '🎯';
      case 'price_alert': return '📈';
      case 'meta_trend': return '🔥';
      case 'risk_warning': return '⚠️';
      case 'market_update': return '📊';
      default: return '🔔';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'text-console-red';
      case 'high': return 'text-console-yellow';
      case 'medium': return 'text-console-cyan';
      case 'low': return 'text-console-dim';
      default: return 'text-console-fg';
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="ascii-button p-2 relative"
        >
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-console-red text-console-bg text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Panel */}
        {showSettings && (
          <div className="absolute top-12 right-0 w-96 max-h-96 overflow-hidden">
            <AsciiFrame title="🔔 Smart Notifications" className="bg-console-bg">
              <div className="space-y-4">
                {/* Header Actions */}
                <div className="flex justify-between items-center">
                  <span className="text-console-dim text-sm">
                    {unreadCount} unread notifications
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={markAllAsRead}
                      className="text-console-cyan text-xs hover:text-console-yellow"
                    >
                      Mark All Read
                    </button>
                    <button
                      onClick={clearNotifications}
                      className="text-console-red text-xs hover:text-console-yellow"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center text-console-dim py-4">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`ascii-box p-3 cursor-pointer hover:bg-console-panel ${
                          !notification.read ? 'border-console-yellow' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className={`font-bold text-sm ${getPriorityColor(notification.priority)}`}>
                              {notification.title}
                            </div>
                            <div className="text-console-dim text-xs mb-1">
                              {notification.message}
                            </div>
                            <div className="text-console-dim text-xs">
                              {formatTimestamp(notification.timestamp)}
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-console-yellow rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Settings Toggle */}
                <div className="border-t border-console-border pt-2">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="ascii-button text-xs w-full"
                  >
                    [ Notification Settings ]
                  </button>
                </div>
              </div>
            </AsciiFrame>
          </div>
        )}
      </div>
    </div>
  );
}