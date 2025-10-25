import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {ApiService} from '../services/ApiService';
import {ConsoleCard} from '../components/ConsoleCard';
import {StatusBadge} from '../components/StatusBadge';

interface TestResult {
  success: boolean;
  service?: string;
  results?: Record<string, any>;
  data?: any;
  message?: string;
  error?: string;
}

const TestScreen = () => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, TestResult>>({});

  const runTest = async (testName: string) => {
    setLoading(prev => ({...prev, [testName]: true}));
    
    try {
      let result: TestResult;
      
      if (testName === 'all') {
        result = await ApiService.testAllAPIs();
      } else {
        result = await ApiService.testAPI(testName);
      }
      
      setResults(prev => ({...prev, [testName]: result}));
    } catch (error) {
      const errorResult: TestResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setResults(prev => ({...prev, [testName]: errorResult}));
    } finally {
      setLoading(prev => ({...prev, [testName]: false}));
    }
  };

  const clearResults = () => {
    setResults({});
  };

  const testConnection = async () => {
    setLoading(prev => ({...prev, connection: true}));
    
    try {
      const isConnected = await ApiService.testConnection();
      const result: TestResult = {
        success: isConnected,
        message: isConnected ? 'Connection successful' : 'Connection failed',
      };
      setResults(prev => ({...prev, connection: result}));
    } catch (error) {
      const errorResult: TestResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Connection error',
      };
      setResults(prev => ({...prev, connection: errorResult}));
    } finally {
      setLoading(prev => ({...prev, connection: false}));
    }
  };

  const renderTestResult = (testName: string, result: TestResult) => {
    return (
      <View key={testName} style={styles.resultItem}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>{testName.toUpperCase()}:</Text>
          <StatusBadge
            status={result.success ? 'success' : 'error'}
            text={result.success ? 'SUCCESS' : 'ERROR'}
            size="small"
          />
        </View>

        {result.message && (
          <Text style={styles.resultMessage}>{result.message}</Text>
        )}

        {result.error && (
          <Text style={styles.resultError}>{result.error}</Text>
        )}

        {result.results && (
          <View style={styles.subResults}>
            {Object.entries(result.results).map(([service, status]: [string, any]) => (
              <View key={service} style={styles.subResult}>
                <Text style={styles.subResultService}>{service}:</Text>
                <Text style={styles.subResultStatus}>
                  {status.status}
                  {status.count && ` (${status.count} items)`}
                  {status.score && ` (Score: ${status.score})`}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Connection Test */}
      <ConsoleCard title="CONNECTION TEST">
        <View style={styles.testSection}>
          <Text style={styles.sectionDescription}>
            Test connection to MetaPulse API server
          </Text>
          
          <TouchableOpacity
            style={[
              styles.button,
              styles.connectionButton,
              loading.connection && styles.buttonDisabled,
            ]}
            onPress={testConnection}
            disabled={loading.connection}>
            {loading.connection ? (
              <ActivityIndicator size="small" color="#00ff41" />
            ) : (
              <Text style={styles.buttonText}>[ TEST CONNECTION ]</Text>
            )}
          </TouchableOpacity>
        </View>
      </ConsoleCard>

      {/* Individual API Tests */}
      <ConsoleCard title="API TESTS">
        <View style={styles.testSection}>
          <Text style={styles.sectionDescription}>
            Test individual API services
          </Text>
          
          <View style={styles.buttonGrid}>
            {['dexscreener', 'pumpportal', 'groq', 'telegram'].map(api => (
              <TouchableOpacity
                key={api}
                style={[
                  styles.button,
                  loading[api] && styles.buttonDisabled,
                ]}
                onPress={() => runTest(api)}
                disabled={loading[api]}>
                {loading[api] ? (
                  <ActivityIndicator size="small" color="#00ff41" />
                ) : (
                  <Text style={styles.buttonText}>[ {api.toUpperCase()} ]</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              styles.allTestButton,
              loading.all && styles.buttonDisabled,
            ]}
            onPress={() => runTest('all')}
            disabled={loading.all}>
            {loading.all ? (
              <ActivityIndicator size="small" color="#00ff41" />
            ) : (
              <Text style={styles.buttonText}>[ TEST ALL APIS ]</Text>
            )}
          </TouchableOpacity>
        </View>
      </ConsoleCard>

      {/* Results */}
      {Object.keys(results).length > 0 && (
        <ConsoleCard title="TEST RESULTS">
          <View style={styles.resultsSection}>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearResults}>
              <Text style={styles.buttonText}>[ CLEAR RESULTS ]</Text>
            </TouchableOpacity>

            <View style={styles.resultsList}>
              {Object.entries(results).map(([testName, result]) =>
                renderTestResult(testName, result)
              )}
            </View>
          </View>
        </ConsoleCard>
      )}

      {/* Instructions */}
      <ConsoleCard title="INSTRUCTIONS">
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            1. First test connection to ensure server is reachable
          </Text>
          <Text style={styles.instructionText}>
            2. Test individual APIs to check their status
          </Text>
          <Text style={styles.instructionText}>
            3. Use "TEST ALL APIS" for comprehensive testing
          </Text>
          <Text style={styles.instructionText}>
            4. Check results for any errors or issues
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
  testSection: {
    marginVertical: 16,
  },
  sectionDescription: {
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#00ff41',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
    minWidth: '45%',
  },
  connectionButton: {
    borderColor: '#00ff41',
    width: '100%',
  },
  allTestButton: {
    borderColor: '#ffff00',
    width: '100%',
  },
  clearButton: {
    borderColor: '#ff4444',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
    borderColor: '#666',
  },
  buttonText: {
    color: '#00ff41',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultsSection: {
    marginVertical: 16,
  },
  resultsList: {
    gap: 12,
  },
  resultItem: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultMessage: {
    color: '#00ff41',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  resultError: {
    color: '#ff4444',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  subResults: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  subResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subResultService: {
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  subResultStatus: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 11,
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

export default TestScreen;