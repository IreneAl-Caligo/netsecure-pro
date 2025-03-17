
/**
 * This service handles API calls for the various security scanning components
 */

export interface ApiConfig {
  apiKey?: string;
  baseUrl?: string;
}

export type ScannerType = 'vulnerability' | 'network' | 'port' | 'traffic';

class ScannerApiService {
  private baseUrls = {
    vulnerability: 'https://api.security-scanner.example',
    network: 'https://api.networkscan.example',
    port: 'https://api.portscan.example',
    traffic: 'https://api.packet-capture.example',
  };
  
  private apiKeys: Record<string, string> = {};

  constructor() {
    // Load any saved API keys on initialization
    this.loadApiKeysFromStorage();
  }

  private loadApiKeysFromStorage() {
    const scannerTypes: ScannerType[] = ['vulnerability', 'network', 'port', 'traffic'];
    scannerTypes.forEach(type => {
      const savedKey = localStorage.getItem(`scanner_api_key_${type}`);
      if (savedKey) {
        this.apiKeys[type] = savedKey;
      }
    });
  }

  /**
   * Set API key for a specific scanner type
   */
  setApiKey(scannerType: ScannerType, apiKey: string) {
    this.apiKeys[scannerType] = apiKey;
    // Store in localStorage for persistence
    localStorage.setItem(`scanner_api_key_${scannerType}`, apiKey);
    return true;
  }

  /**
   * Get API key for a specific scanner type
   */
  getApiKey(scannerType: ScannerType): string {
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
  clearApiKey(scannerType: ScannerType) {
    delete this.apiKeys[scannerType];
    localStorage.removeItem(`scanner_api_key_${scannerType}`);
  }

  /**
   * Check if an API key is valid by making a test request
   */
  async testApiKey(scannerType: ScannerType, apiKey: string): Promise<boolean> {
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
  private getHeaders(scannerType: ScannerType): HeadersInit {
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
    scannerType: ScannerType,
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

  /**
   * Get real-time vulnerability data for a URL
   */
  async scanForVulnerabilities(url: string, options: any = {}): Promise<any> {
    try {
      const response = await this.makeRequest(
        'vulnerability',
        'scan',
        { target: url, options },
        '/api/vulnerability-scan'
      );
      
      if (response.ok) {
        return await response.json();
      }
      
      throw new Error('Failed to scan for vulnerabilities');
    } catch (error) {
      console.error('Vulnerability scan error:', error);
      throw error;
    }
  }

  /**
   * Perform network scan to discover devices
   */
  async scanNetwork(ipRange: string, scanMethod: string): Promise<any> {
    try {
      const response = await this.makeRequest(
        'network',
        'scan',
        { ipRange, scanMethod },
        '/api/network-scan'
      );
      
      if (response.ok) {
        return await response.json();
      }
      
      throw new Error('Failed to scan network');
    } catch (error) {
      console.error('Network scan error:', error);
      throw error;
    }
  }

  /**
   * Scan ports on a target
   */
  async scanPorts(target: string, portRange: string, scanType: string): Promise<any> {
    try {
      const response = await this.makeRequest(
        'port',
        'scan',
        { target, portRange, scanType },
        '/api/port-scan'
      );
      
      if (response.ok) {
        return await response.json();
      }
      
      throw new Error('Failed to scan ports');
    } catch (error) {
      console.error('Port scan error:', error);
      throw error;
    }
  }

  /**
   * Analyze network traffic
   */
  async analyzeTraffic(interface_: string, filter: string, duration: number): Promise<any> {
    try {
      const response = await this.makeRequest(
        'traffic',
        'capture',
        { interface: interface_, filter, duration },
        '/api/traffic-analyze'
      );
      
      if (response.ok) {
        return await response.json();
      }
      
      throw new Error('Failed to analyze traffic');
    } catch (error) {
      console.error('Traffic analysis error:', error);
      throw error;
    }
  }
}

// Export as singleton
export const scannerApi = new ScannerApiService();
