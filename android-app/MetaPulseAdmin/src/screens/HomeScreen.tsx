import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {ApiService} from '../services/ApiService';
import {ConsoleCard} from '../components/ConsoleCard';
import {StatusBadge} from '../components/StatusBadge';

interface AnalyzerStats {
  isRunning: boolean;
  processedTokensCount: number;
  uptime: number;
}

const HomeScreen = () => {
  const navigation = useNavigation();
  const [stats, setStats] = useState<AnalyzerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await ApiService.getAnalyzerStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      Alert.alert('Error', 'Failed to fetch system stats');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const handleAnalyzerAction = async (action: string) => {
    setLoading(true);
    try {
      await ApiService.controlAnalyzer(action);
      Alert.alert('Success', `Analyzer ${action} successful`);
      await fetchStats();
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} analyzer`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (uptime: number) => {
    if (!uptime) return '0m';
    const minutes = Math.floor((Date.now() - uptime) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Header */}
      <ConsoleCard title="SYSTEM STATUS">
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>ANALYZER</Text>
            <StatusBadge
              status={stats?.isRunning ? 'running' : 'stopped'}
              text={stats?.isRunning ? 'RUNNING' : 'STOPPED'}
            />
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>TOKENS</Text>
            <Text style={styles.statusValue}>
              {stats?.processedTokensCount || 0}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>UPTIME</Text>
            <Text style={styles.statusValue}>
              {formatUptime(stats?.uptime || 0)}
            </Text>
          </View>
        </View>
      </ConsoleCard>

      {/* Controls */}
      <ConsoleCard title="ANALYZER CONTROLS">
        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.startButton,
              (loading || stats?.isRunning) && styles.buttonDisabled,
            ]}
            onPress={() => handleAnalyzerAction('start')}
            disabled={loading || stats?.isRunning}>
            <Text style={styles.buttonText}>[ START ]</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.stopButton,
              (loading || !stats?.isRunning) && styles.buttonDisabled,
            ]}
            onPress={() => handleAnalyzerAction('stop')}
            disabled={loading || !stats?.isRunning}>
            <Text style={styles.buttonText}>[ STOP ]</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={() => handleAnalyzerAction('clear-cache')}
            disabled={loading}>
            <Text style={styles.buttonText}>[ CLEAR CACHE ]</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={fetchStats}>
            <Text style={styles.buttonText}>[ REFRESH ]</Text>
          </TouchableOpacity>
        </View>
      </ConsoleCard>

      {/* Navigation */}
      <ConsoleCard title="NAVIGATION">
        <View style={styles.navGrid}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Analyzer' as never)}>
            <Text style={styles.navButtonText}>🔍</Text>
            <Text style={styles.navButtonLabel}>ANALYZER</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Test' as never)}>
            <Text style={styles.navButtonText}>🧪</Text>
            <Text style={styles.navButtonLabel}>API TESTS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Settings' as never)}>
            <Text style={styles.navButtonText}>⚙️</Text>
            <Text style={styles.navButtonLabel}>SETTINGS</Text>
          </TouchableOpacity>
        </View>
      </ConsoleCard>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ┌─────────────────────────────────────┐
        </Text>
        <Text style={styles.footerText}>
          │     MetaPulse AI Admin v1.0     │
        </Text>
        <Text style={styles.footerText}>
          └─────────────────────────────────────┘
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  statusValue: {
    color: '#00ff41',
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#00ff41',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    minWidth: '45%',
    alignItems: 'center',
  },
  startButton: {
    borderColor: '#00ff41',
  },
  stopButton: {
    borderColor: '#ff4444',
  },
  buttonDisabled: {
    opacity: 0.5,
    borderColor: '#666',
  },
  buttonText: {
    color: '#00ff41',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
  },
  navGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  navButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    minWidth: 80,
  },
  navButtonText: {
    fontSize: 24,
    marginBottom: 8,
  },
  navButtonLabel: {
    color: '#00ff41',
    fontFamily: 'monospace',
    fontSize: 10,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  footerText: {
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 12,
  },
});

export default HomeScreen;