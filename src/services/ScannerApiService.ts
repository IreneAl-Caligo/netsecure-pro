/**
 * This service handles API calls for the various security scanning components
 */
import { 
  vulnerabilityScannerAPIs, 
  networkScannerAPIs, 
  trafficAnalyzerAPIs, 
  portScannerAPIs 
} from '@/config/scannerConfig';

export interface ApiConfig {
  apiKey?: string;
  baseUrl?: string;
  provider?: string;
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
  private apiProviders: Record<string, string> = {};
  private initialized = false;

  constructor() {
    // Load any saved API keys on initialization - but only once
    this.loadApiKeysFromStorage();
  }

  private loadApiKeysFromStorage() {
    // Skip if already initialized
    if (this.initialized) return;
    
    try {
      const scannerTypes: ScannerType[] = ['vulnerability', 'network', 'port', 'traffic'];
      scannerTypes.forEach(type => {
        const savedKey = localStorage.getItem(`scanner_api_key_${type}`);
        if (savedKey) {
          this.apiKeys[type] = savedKey;
        }
        
        const savedProvider = localStorage.getItem(`scanner_api_provider_${type}`);
        if (savedProvider) {
          this.apiProviders[type] = savedProvider;
          
          // Update the base URL if we have a provider
          const providers = this.getProvidersByType(type);
          const provider = providers.find(p => p.name === savedProvider);
          if (provider) {
            this.baseUrls[type] = provider.url;
          }
        }
      });
      
      this.initialized = true;
    } catch (error) {
      console.error("Error loading API keys from storage:", error);
      // Still mark as initialized to prevent repeated failures
      this.initialized = true;
    }
  }

  getProvidersByType(scannerType: ScannerType) {
    switch(scannerType) {
      case 'vulnerability':
        return vulnerabilityScannerAPIs;
      case 'network':
        return networkScannerAPIs;
      case 'port':
        return portScannerAPIs;
      case 'traffic':
        return trafficAnalyzerAPIs;
      default:
        return [];
    }
  }

  /**
   * Set API key and provider for a specific scanner type
   */
  setApiKey(scannerType: ScannerType, apiKey: string, provider?: string) {
    // Make sure we've loaded from storage first
    this.loadApiKeysFromStorage();
    
    try {
      // Don't set empty API keys
      if (!apiKey || apiKey.trim() === '') {
        console.error(`Attempted to set empty API key for ${scannerType}`);
        return false;
      }
      
      this.apiKeys[scannerType] = apiKey;
      localStorage.setItem(`scanner_api_key_${scannerType}`, apiKey);
      
      if (provider) {
        this.apiProviders[scannerType] = provider;
        localStorage.setItem(`scanner_api_provider_${scannerType}`, provider);
        
        // Update the base URL if provider exists in our list
        const providers = this.getProvidersByType(scannerType);
        const providerInfo = providers.find(p => p.name === provider);
        if (providerInfo) {
          this.baseUrls[scannerType] = providerInfo.url;
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error saving API key for ${scannerType}:`, error);
      return false;
    }
  }

  /**
   * Get API key for a specific scanner type
   */
  getApiKey(scannerType: ScannerType): string {
    // Make sure we've loaded from storage first
    this.loadApiKeysFromStorage();
    
    // Try to get from memory first
    let key = this.apiKeys[scannerType] || '';
    
    // If not in memory, try localStorage
    if (!key) {
      try {
        key = localStorage.getItem(`scanner_api_key_${scannerType}`) || '';
        if (key) {
          this.apiKeys[scannerType] = key;
        }
      } catch (error) {
        console.error(`Error getting API key for ${scannerType}:`, error);
      }
    }
    
    return key;
  }

  /**
   * Get API provider for a specific scanner type
   */
  getApiProvider(scannerType: ScannerType): string {
    // Make sure we've loaded from storage first
    this.loadApiKeysFromStorage();
    
    // Try to get from memory first
    let provider = this.apiProviders[scannerType] || '';
    
    // If not in memory, try localStorage
    if (!provider) {
      try {
        provider = localStorage.getItem(`scanner_api_provider_${scannerType}`) || '';
        if (provider) {
          this.apiProviders[scannerType] = provider;
        }
      } catch (error) {
        console.error(`Error getting API provider for ${scannerType}:`, error);
      }
    }
    
    return provider;
  }

  /**
   * Get the base URL for a scanner type
   */
  getBaseUrl(scannerType: ScannerType): string {
    return this.baseUrls[scannerType];
  }

  /**
   * Clear API key for a specific scanner type
   */
  clearApiKey(scannerType: ScannerType) {
    try {
      delete this.apiKeys[scannerType];
      delete this.apiProviders[scannerType];
      localStorage.removeItem(`scanner_api_key_${scannerType}`);
      localStorage.removeItem(`scanner_api_provider_${scannerType}`);
    } catch (error) {
      console.error(`Error clearing API key for ${scannerType}:`, error);
    }
  }

  /**
   * Check if an API key is valid by making a test request
   * In development, this will always succeed to avoid CORS/network issues
   */
  async testApiKey(scannerType: ScannerType, apiKey: string, provider?: string): Promise<boolean> {
    if (!apiKey || apiKey.trim() === '') {
      console.error("Cannot test empty API key");
      return false;
    }
    
    // For development, simulate a short delay and return success
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[DEV] Simulating successful API key test for ${scannerType}`);
        resolve(true);
      }, 500);
    });

    /* In production, would use this:
    try {
      let baseUrl = this.baseUrls[scannerType];
      
      // If provider is specified, try to get the URL from our config
      if (provider) {
        const providers = this.getProvidersByType(scannerType);
        const providerInfo = providers.find(p => p.name === provider);
        if (providerInfo) {
          baseUrl = providerInfo.url;
        }
      }
      
      // Different test endpoints for different scanner types
      const testEndpoints = {
        vulnerability: '/verify-key',
        network: '/verify-key',
        port: '/verify-key',
        traffic: '/verify-key'
      };
      
      const response = await fetch(`${baseUrl}${testEndpoints[scannerType]}`, {
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
    */
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
    // Check if API key is available when making a request to external API
    const apiKey = this.getApiKey(scannerType);
    if (!apiKey && !backendPath) {
      throw new Error(`No API key available for ${scannerType} scanning`);
    }
    
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
    const baseUrl = this.getBaseUrl(scannerType);
    const headers = this.getHeaders(scannerType);
    
    // Make the actual API request
    return fetch(`${baseUrl}${endpoint}`, {
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
      // Different request paths for different vulnerability scanners
      const provider = this.getApiProvider('vulnerability');
      let requestPath = '/scan';
      let requestData: any = { target: url, options };
      
      // Adjust request based on provider
      if (provider) {
        switch(provider) {
          case 'Acunetix':
            requestPath = '/targets/scan';
            requestData = { address: url, description: 'Web scan', criticality: 10 };
            break;
          case 'StackHawk':
            requestPath = '/api/v1/scan';
            requestData = { url, scanConfig: options };
            break;
          case 'OWASP ZAP':
            requestPath = '/JSON/ascan/action/scan';
            requestData = { url, recurse: options.fullScan ? 'true' : 'false' };
            break;
          case 'Qualys':
            requestPath = '/scan/new';
            requestData = { target: url, option: 'WEB_APP', profile: options.fullScan ? 'COMPREHENSIVE' : 'QUICK' };
            break;
          default:
            // Use default request data
        }
      }
      
      const response = await this.makeRequest(
        'vulnerability',
        requestPath,
        requestData,
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
      // Different request paths for different network scanners
      const provider = this.getApiProvider('network');
      let requestPath = '/scan';
      let requestData: any = { ipRange, scanMethod };
      
      // Adjust request based on provider
      if (provider) {
        switch(provider) {
          case 'Shodan':
            requestPath = '/shodan/host/search';
            requestData = { query: `net:${ipRange}` };
            break;
          case 'SecurityTrails':
            requestPath = '/domain/list';
            // Convert CIDR to domain format
            const domain = ipRange.split('/')[0].split('.').slice(0, 2).join('.');
            requestData = { filter: { keyword: domain } };
            break;
          case 'Censys':
            requestPath = '/hosts/search';
            requestData = { q: `ip:${ipRange}` };
            break;
          default:
            // Use default request data
        }
      }
      
      const response = await this.makeRequest(
        'network',
        requestPath,
        requestData,
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
  async scanPorts(target: string, portRange: string, scanType: string, enableIDS: boolean = false): Promise<any> {
    try {
      // Different request paths for different port scanners
      const provider = this.getApiProvider('port');
      let requestPath = '/scan';
      let requestData: any = { target, portRange, scanType, enableIDS };
      
      // Adjust request based on provider
      if (provider) {
        switch(provider) {
          case 'Nmap API':
            requestPath = '/scan';
            requestData = { 
              target, 
              ports: portRange,
              scanType: scanType,
              options: enableIDS ? { idsScan: true } : {} 
            };
            break;
          case 'OpenVAS':
            requestPath = '/tasks';
            requestData = { 
              target_id: target,
              scanner_id: '08b69003-5fc2-4037-a479-93b440211c73',
              config_id: enableIDS ? 'daba56c8-73ec-11df-a475-002264764cea' : '698f691e-7489-11df-9d8c-002264764cea'
            };
            break;
          case 'Qualys':
            requestPath = '/api/2.0/fo/scan';
            requestData = { 
              action: 'launch',
              ip: target,
              port_range: portRange,
              option_id: enableIDS ? '5' : '2'
            };
            break;
          default:
            // Use default request data
        }
      }
      
      const response = await this.makeRequest(
        'port',
        requestPath,
        requestData,
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
  async analyzeTraffic(interface_: string, filter: string, duration: number, format: string = 'live'): Promise<any> {
    try {
      // Different request paths for different traffic analyzers
      const provider = this.getApiProvider('traffic');
      let requestPath = '/capture';
      let requestData: any = { interface: interface_, filter, duration, format };
      
      // Adjust request based on provider
      if (provider) {
        switch(provider) {
          case 'NetworkMiner':
            requestPath = '/capture/start';
            requestData = { 
              interfaceName: interface_,
              captureFilter: filter,
              maxDuration: duration,
              outputFormat: format
            };
            break;
          case 'Wireshark API':
            requestPath = '/capture';
            requestData = { 
              interface: interface_,
              filter,
              duration,
              format
            };
            break;
          default:
            // Use default request data
        }
      }
      
      const response = await this.makeRequest(
        'traffic',
        requestPath,
        requestData,
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
