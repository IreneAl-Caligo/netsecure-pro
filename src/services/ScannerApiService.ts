
/**
 * This service handles API calls for the various security scanning components
 */

export interface ApiConfig {
  apiKey?: string;
  baseUrl?: string;
}

class ScannerApiService {
  private baseUrls = {
    vulnerability: 'https://api.security-scanner.example',
    network: 'https://api.networkscan.example',
    port: 'https://api.portscan.example',
    traffic: 'https://api.packet-capture.example',
  };
  
  private apiKeys: Record<string, string> = {};

  /**
   * Set API key for a specific scanner type
   */
  setApiKey(scannerType: 'vulnerability' | 'network' | 'port' | 'traffic', apiKey: string) {
    this.apiKeys[scannerType] = apiKey;
    // Store in localStorage for persistence
    localStorage.setItem(`scanner_api_key_${scannerType}`, apiKey);
    return true;
  }

  /**
   * Get API key for a specific scanner type
   */
  getApiKey(scannerType: 'vulnerability' | 'network' | 'port' | 'traffic'): string {
    // Try to get from memory first
    let key = this.apiKeys[scannerType];
    
    // If not in memory, try localStorage
    if (!key) {
      key = localStorage.getItem(`scanner_api_key_${scannerType}`) || '';
      if (key) {
        this.apiKeys[scannerType] = key;
      }
    }
    
    return key;
  }

  /**
   * Clear API key for a specific scanner type
   */
  clearApiKey(scannerType: 'vulnerability' | 'network' | 'port' | 'traffic') {
    delete this.apiKeys[scannerType];
    localStorage.removeItem(`scanner_api_key_${scannerType}`);
  }

  /**
   * Check if an API key is valid by making a test request
   */
  async testApiKey(scannerType: 'vulnerability' | 'network' | 'port' | 'traffic', apiKey: string): Promise<boolean> {
    try {
      const baseUrl = this.baseUrls[scannerType];
      const response = await fetch(`${baseUrl}/verify-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ test: true })
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Error testing API key for ${scannerType}:`, error);
      return false;
    }
  }

  /**
   * Get headers with API key if available
   */
  private getHeaders(scannerType: 'vulnerability' | 'network' | 'port' | 'traffic'): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    const apiKey = this.getApiKey(scannerType);
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    return headers;
  }

  /**
   * Make a scan request to our backend API first, then to external API if that fails
   */
  async makeRequest(
    scannerType: 'vulnerability' | 'network' | 'port' | 'traffic',
    endpoint: string,
    data: any,
    backendPath?: string
  ): Promise<Response> {
    // Try our backend API first if a path is provided
    if (backendPath) {
      try {
        const response = await fetch(backendPath, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          return response;
        }
      } catch (e) {
        console.log(`Backend API ${backendPath} not available, trying external service`);
      }
    }
    
    // If backend API fails or doesn't exist, try external API
    const baseUrl = this.baseUrls[scannerType];
    const headers = this.getHeaders(scannerType);
    
    return fetch(`${baseUrl}/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
  }
}

// Export as singleton
export const scannerApi = new ScannerApiService();
