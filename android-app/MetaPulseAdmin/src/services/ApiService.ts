import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiServiceClass {
  private baseUrl: string = '';

  constructor() {
    this.loadBaseUrl();
  }

  private async loadBaseUrl() {
    try {
      const savedUrl = await AsyncStorage.getItem('api_base_url');
      this.baseUrl = savedUrl || 'http://192.168.1.100:5174'; // Default local IP
    } catch (error) {
      console.error('Error loading base URL:', error);
      this.baseUrl = 'http://192.168.1.100:5174';
    }
  }

  async setBaseUrl(url: string) {
    this.baseUrl = url;
    try {
      await AsyncStorage.setItem('api_base_url', url);
    } catch (error) {
      console.error('Error saving base URL:', error);
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`[ApiService] Making request to: ${url}`);

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      return data.data || data;
    } catch (error) {
      console.error(`[ApiService] Error with ${endpoint}:`, error);
      throw error;
    }
  }

  // Analyzer endpoints
  async getAnalyzerStats() {
    return this.makeRequest('/api/analyzer');
  }

  async controlAnalyzer(action: string) {
    return this.makeRequest('/api/analyzer', {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  async analyzeToken(mint: string) {
    return this.makeRequest('/api/analyzer', {
      method: 'POST',
      body: JSON.stringify({ action: 'analyze', mint }),
    });
  }

  // Test endpoints
  async testAPI(apiName: string) {
    return this.makeRequest(`/api/test?test=${apiName}`);
  }

  async testAllAPIs() {
    return this.makeRequest('/api/test?test=all');
  }

  // Connection test
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analyzer`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/analyzer`);
      if (response.ok) {
        const data = await response.json();
        return {
          status: 'online',
          data: data.data || data,
        };
      } else {
        return {
          status: 'error',
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return {
        status: 'offline',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const ApiService = new ApiServiceClass();