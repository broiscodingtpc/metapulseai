import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {ApiService} from '../services/ApiService';
import {ConsoleCard} from '../components/ConsoleCard';
import {StatusBadge} from '../components/StatusBadge';

interface TokenAnalysis {
  mint: string;
  name: string;
  symbol: string;
  analysis?: {
    score: number;
    sentiment: string;
    metaCategory: string;
    riskLevel: string;
    keyPoints: string[];
  };
}

const AnalyzerScreen = () => {
  const [mintAddress, setMintAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TokenAnalysis | null>(null);

  const analyzeToken = async () => {
    if (!mintAddress.trim()) {
      Alert.alert('Error', 'Please enter a mint address');
      return;
    }

    setLoading(true);
    try {
      const data = await ApiService.analyzeToken(mintAddress.trim());
      setResult(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze token');
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setMintAddress('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#00ff41';
    if (score >= 50) return '#ffff00';
    if (score >= 30) return '#ff8800';
    return '#ff4444';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#00ff41';
      case 'medium': return '#ffff00';
      case 'high': return '#ff4444';
      default: return '#666';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Input Section */}
      <ConsoleCard title="TOKEN ANALYSIS">
        <View style={styles.inputSection}>
          <Text style={styles.label}>MINT ADDRESS:</Text>
          <TextInput
            style={styles.input}
            value={mintAddress}
            onChangeText={setMintAddress}
            placeholder="Enter Solana token mint address..."
            placeholderTextColor="#666"
            multiline={false}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.analyzeButton,
                (loading || !mintAddress.trim()) && styles.buttonDisabled,
              ]}
              onPress={analyzeToken}
              disabled={loading || !mintAddress.trim()}>
              {loading ? (
                <ActivityIndicator size="small" color="#00ff41" />
              ) : (
                <Text style={styles.buttonText}>[ ANALYZE ]</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={clearResult}>
              <Text style={styles.buttonText}>[ CLEAR ]</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ConsoleCard>

      {/* Results Section */}
      {result && (
        <ConsoleCard title="ANALYSIS RESULTS">
          <View style={styles.resultSection}>
            {/* Token Info */}
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenName}>{result.name}</Text>
              <Text style={styles.tokenSymbol}>({result.symbol})</Text>
              <Text style={styles.mintText}>{result.mint}</Text>
            </View>

            {/* Analysis Data */}
            {result.analysis && (
              <View style={styles.analysisData}>
                {/* Score */}
                <View style={styles.scoreSection}>
                  <Text style={styles.scoreLabel}>SCORE:</Text>
                  <Text
                    style={[
                      styles.scoreValue,
                      {color: getScoreColor(result.analysis.score)},
                    ]}>
                    {result.analysis.score}/100
                  </Text>
                </View>

                {/* Metrics Grid */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>SENTIMENT</Text>
                    <StatusBadge
                      status={result.analysis.sentiment}
                      text={result.analysis.sentiment.toUpperCase()}
                    />
                  </View>

                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>CATEGORY</Text>
                    <Text style={styles.metricValue}>
                      {result.analysis.metaCategory}
                    </Text>
                  </View>

                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>RISK</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        {color: getRiskColor(result.analysis.riskLevel)},
                      ]}>
                      {result.analysis.riskLevel.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Key Points */}
                {result.analysis.keyPoints && result.analysis.keyPoints.length > 0 && (
                  <View style={styles.keyPointsSection}>
                    <Text style={styles.keyPointsTitle}>KEY POINTS:</Text>
                    {result.analysis.keyPoints.map((point, index) => (
                      <Text key={index} style={styles.keyPoint}>
                        • {point}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </ConsoleCard>
      )}

      {/* Instructions */}
      <ConsoleCard title="INSTRUCTIONS">
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            1. Enter a Solana token mint address
          </Text>
          <Text style={styles.instructionText}>
            2. Tap ANALYZE to get AI-powered analysis
          </Text>
          <Text style={styles.instructionText}>
            3. Review score, sentiment, and risk assessment
          </Text>
          <Text style={styles.instructionText}>
            4. Use results for trading decisions
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
  inputSection: {
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
  analyzeButton: {
    borderColor: '#00ff41',
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
  resultSection: {
    marginVertical: 16,
  },
  tokenInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tokenName: {
    color: '#00ff41',
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tokenSymbol: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 16,
    marginTop: 4,
  },
  mintText: {
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
  },
  analysisData: {
    gap: 16,
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  scoreLabel: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreValue: {
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metric: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  metricLabel: {
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 10,
    marginBottom: 8,
  },
  metricValue: {
    color: '#00ff41',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  keyPointsSection: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  keyPointsTitle: {
    color: '#00ff41',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  keyPoint: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
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

export default AnalyzerScreen;