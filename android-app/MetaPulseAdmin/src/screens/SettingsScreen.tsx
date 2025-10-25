import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ApiService} from '../services/ApiService';
import {ConsoleCard} from '../components/ConsoleCard';
import {StatusBadge} from '../components/StatusBadge';

const SettingsScreen = () => {
  const [apiUrl, setApiUrl] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('5');
  const [connectionStatus, setConnectionStatus] = useState<string>('unknown');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem('api_base_url');
      const savedNotifications = await AsyncStorage.getItem('notifications');
      const savedAutoRefresh = await AsyncStorage.getItem('auto_refresh');
      const savedInterval = await AsyncStorage.getItem('refresh_interval');

      setApiUrl(savedUrl || 'http://192.168.1.100:5174');
      setNotifications(savedNotifications !== 'false');
      setAutoRefresh(savedAutoRefresh !== 'false');
      setRefreshInterval(savedInterval || '5');

      // Test connection with current URL
      testConnection();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('api_base_url', apiUrl);
      await AsyncStorage.setItem('notifications', notifications.toString());
      await AsyncStorage.setItem('auto_refresh', autoRefresh.toString());
      await AsyncStorage.setItem('refresh_interval', refreshInterval);

      // Update API service
      await ApiService.setBaseUrl(apiUrl);

      Alert.alert('Success', 'Settings saved successfully');
      testConnection();
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
      console.error('Error saving settings:', error);
    }
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const health = await ApiService.healthCheck();
      setConnectionStatus(health.status);
    } catch (error) {
      setConnectionStatus('error');
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setApiUrl('http://192.168.1.100:5174');
            setNotifications(true);
            setAutoRefresh(true);
            setRefreshInterval('5');
          },
        },
      ]
    );
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'online': return 'success';
      case 'testing': return 'warning';
      case 'offline':
      case 'error': return 'error';
      default: return 'warning';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'online': return 'CONNECTED';
      case 'testing': return 'TESTING...';
      case 'offline': return 'OFFLINE';
      case 'error': return 'ERROR';
      default: return 'UNKNOWN';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Connection Settings */}
      <ConsoleCard title="CONNECTION SETTINGS">
        <View style={styles.settingSection}>
          <Text style={styles.label}>API BASE URL:</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://192.168.1.100:5174"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.connectionStatus}>
            <Text style={styles.statusLabel}>CONNECTION STATUS:</Text>
            <StatusBadge
              status={getConnectionStatusColor()}
              text={getConnectionStatusText()}
              size="small"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.testButton]}
              onPress={testConnection}>
              <Text style={styles.buttonText}>[ TEST ]</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={saveSettings}>
              <Text style={styles.buttonText}>[ SAVE ]</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ConsoleCard>

      {/* App Settings */}
      <ConsoleCard title="APP SETTINGS">
        <View style={styles.settingSection}>
          {/* Notifications */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>NOTIFICATIONS</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{false: '#333', true: '#00ff41'}}
              thumbColor={notifications ? '#fff' : '#666'}
            />
          </View>

          {/* Auto Refresh */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>AUTO REFRESH</Text>
            <Switch
              value={autoRefresh}
              onValueChange={setAutoRefresh}
              trackColor={{false: '#333', true: '#00ff41'}}
              thumbColor={autoRefresh ? '#fff' : '#666'}
            />
          </View>

          {/* Refresh Interval */}
          {autoRefresh && (
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>REFRESH INTERVAL (seconds):</Text>
              <TextInput
                style={styles.smallInput}
                value={refreshInterval}
                onChangeText={setRefreshInterval}
                keyboardType="numeric"
                placeholder="5"
                placeholderTextColor="#666"
              />
            </View>
          )}
        </View>
      </ConsoleCard>

      {/* System Info */}
      <ConsoleCard title="SYSTEM INFO">
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>APP VERSION:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>API URL:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {ApiService.getBaseUrl()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CONNECTION:</Text>
            <StatusBadge
              status={getConnectionStatusColor()}
              text={getConnectionStatusText()}
              size="small"
            />
          </View>
        </View>
      </ConsoleCard>

      {/* Actions */}
      <ConsoleCard title="ACTIONS" variant="danger">
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={resetToDefaults}>
            <Text style={styles.buttonText}>[ RESET TO DEFAULTS ]</Text>
          </TouchableOpacity>

          <Text style={styles.warningText}>
            ⚠️ This will reset all settings to their default values
          </Text>
        </View>
      </ConsoleCard>

      {/* Instructions */}
      <ConsoleCard title="SETUP INSTRUCTIONS">
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            1. Make sure your computer and phone are on the same network
          </Text>
          <Text style={styles.instructionText}>
            2. Find your computer's IP address (ipconfig/ifconfig)
          </Text>
          <Text style={styles.instructionText}>
            3. Enter the IP with port 5174 (e.g., http://192.168.1.100:5174)
          </Text>
          <Text style={styles.instructionText}>
            4. Test connection and save settings
          </Text>
          <Text style={styles.instructionText}>
            5. Enable notifications for real-time updates
          </Text>
        </View>
      </ConsoleCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 16,
  },
  settingSection: {
    marginVertical: 16,
  },
  label: {
    color: '#00ff41',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 14,
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  connectionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#00ff41',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
  },
  testButton: {
    borderColor: '#ffff00',
  },
  saveButton: {
    borderColor: '#00ff41',
  },
  resetButton: {
    borderColor: '#ff4444',
    width: '100%',
  },
  buttonText: {
    color: '#00ff41',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 8,
  },
  smallInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 14,
    padding: 8,
    borderRadius: 4,
    width: 80,
  },
  infoSection: {
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  infoValue: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  actionsSection: {
    marginVertical: 16,
    alignItems: 'center',
  },
  warningText: {
    color: '#ff4444',
    fontFamily: 'monospace',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
  instructions: {
    marginVertical: 16,
  },
  instructionText: {
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 8,
  },
});

export default SettingsScreen;