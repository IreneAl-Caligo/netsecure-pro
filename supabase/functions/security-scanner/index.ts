
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scanType, endpoint, apiKey, provider, data } = await req.json();

    // Validate required parameters
    if (!scanType || !endpoint || !apiKey || !provider) {
      return new Response(
        JSON.stringify({ error: "API Error: Missing required parameters" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Received scan request for ${scanType} using ${provider}`);

    // Determine the base URL based on scanType and provider
    let baseUrl = '';
    let finalEndpoint = endpoint;
    let requestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    let requestMethod = 'POST';
    let requestBody = data;
    
    // Provider-specific configurations
    switch (scanType) {
      case 'vulnerability':
        switch (provider) {
          case 'Acunetix':
            baseUrl = 'https://api.acunetix.com/v1';
            break;
          case 'StackHawk':
            baseUrl = 'https://api.stackhawk.com/v1';
            break;
          case 'OWASP ZAP':
            baseUrl = 'https://api.zaproxy.org/v1';
            break;
          default:
            baseUrl = 'https://api.security-scanner.example';
        }
        break;
      case 'network':
        switch (provider) {
          case 'Shodan':
            baseUrl = 'https://api.shodan.io';
            // Shodan uses API key as a query parameter, not header
            requestHeaders = { 'Content-Type': 'application/json' };
            
            // Convert request to Shodan format
            if (endpoint === '/shodan/host/search') {
              // For CIDR notation queries, use the /shodan/host/search/net endpoint
              if (data.query && data.query.startsWith('net:')) {
                finalEndpoint = '/shodan/host/search/net';
                const network = data.query.replace('net:', '');
                // Shodan expects the network as part of the URL path for /net endpoint
                finalEndpoint = `${finalEndpoint}?key=${apiKey}&query=${encodeURIComponent(network)}`;
                requestMethod = 'GET';
                requestBody = undefined;
              } else {
                // Regular host search
                finalEndpoint = `${endpoint}?key=${apiKey}`;
                for (const [key, value] of Object.entries(data)) {
                  finalEndpoint += `&${key}=${encodeURIComponent(String(value))}`;
                }
                requestMethod = 'GET';
                requestBody = undefined;
              }
            }
            break;
          case 'SecurityTrails':
            baseUrl = 'https://api.securitytrails.com/v1';
            requestHeaders = {
              'Content-Type': 'application/json',
              'APIKEY': apiKey
            };
            break;
          case 'Censys':
            baseUrl = 'https://search.censys.io/api/v2';
            // Censys uses Basic auth
            const encodedCreds = btoa(`${apiKey}:''`);
            requestHeaders = {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${encodedCreds}`
            };
            break;
          default:
            baseUrl = 'https://api.networkscan.example';
        }
        break;
      case 'port':
        switch (provider) {
          case 'Nmap API':
            baseUrl = 'https://api.nmap.org/v1';
            break;
          case 'OpenVAS':
            baseUrl = 'https://api.openvas.org/v1';
            break;
          case 'Qualys':
            baseUrl = 'https://api.qualys.com/v1';
            break;
          default:
            baseUrl = 'https://api.portscan.example';
        }
        break;
      case 'traffic':
        switch (provider) {
          case 'NetworkMiner':
            baseUrl = 'https://api.networkminer.net/v1';
            break;
          case 'Wireshark API':
            baseUrl = 'https://api.wireshark.org/v1';
            break;
          case 'Cloudshark':
            baseUrl = 'https://api.cloudshark.org/v1';
            break;
          default:
            baseUrl = 'https://api.packet-capture.example';
        }
        break;
      default:
        return new Response(
          JSON.stringify({ error: "API Error: Invalid scan type" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    // Make the request to the external API
    try {
      console.log(`Making request to ${baseUrl}${finalEndpoint}`);
      
      const apiResponse = await fetch(`${baseUrl}${finalEndpoint}`, {
        method: requestMethod,
        headers: requestHeaders,
        body: requestBody ? JSON.stringify(requestBody) : undefined
      });

      // Check if the response is ok
      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error(`API responded with status ${apiResponse.status}: ${errorText}`);
        
        // For development purposes, return simulated data if the API fails
        // This helps developers test without real API access
        console.log("API call failed, providing simulated response");
        
        // Create simulated response based on scanner type
        let simulatedResponse = {};
        switch (scanType) {
          case 'network':
            simulatedResponse = simulateNetworkScan(data);
            break;
          case 'vulnerability':
            simulatedResponse = simulateVulnerabilityScan(data);
            break;
          case 'port':
            simulatedResponse = simulatePortScan(data);
            break;
          case 'traffic':
            simulatedResponse = simulateTrafficAnalysis(data);
            break;
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "This is simulated data because the API call failed. Please check your API key and configuration.",
            ...simulatedResponse
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Parse the response
      const responseData = await apiResponse.json();
      console.log(`Successfully received response from ${provider} API`);

      // Return the response to the client
      return new Response(
        JSON.stringify(responseData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (error) {
      console.error(`API request error: ${error.message}`);

      // Generate simulated data for development purposes
      console.log("API connection failed, providing simulated response");
      
      // Create simulated response based on scanner type
      let simulatedResponse = {};
      switch (scanType) {
        case 'network':
          simulatedResponse = simulateNetworkScan(data);
          break;
        case 'vulnerability':
          simulatedResponse = simulateVulnerabilityScan(data);
          break;
        case 'port':
          simulatedResponse = simulatePortScan(data);
          break;
        case 'traffic':
          simulatedResponse = simulateTrafficAnalysis(data);
          break;
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "This is simulated data because the API connection failed. This helps with development.",
          ...simulatedResponse
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    
    return new Response(
      JSON.stringify({ error: `API Error: Internal error: ${error.message}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})

// Helper function to simulate network scan data
function simulateNetworkScan(requestData: any) {
  const devices = [];
  const ipBase = requestData.ipRange ? requestData.ipRange.split('/')[0].split('.').slice(0, 3).join('.') : '192.168.1';
  const numDevices = Math.floor(Math.random() * 10) + 3;
  
  for (let i = 1; i <= numDevices; i++) {
    devices.push({
      ip: `${ipBase}.${i + 1}`,
      mac: `00:1A:2B:${i < 10 ? '0' + i : i}:CD:EF`,
      hostname: i % 3 === 0 ? `device-${i}` : `host-${ipBase.replace(/\./g, '-')}-${i}`,
      status: "Online",
      vendor: i % 4 === 0 ? "Apple Inc." : i % 3 === 0 ? "Intel Corporate" : "Dell Inc.",
      os: i % 5 === 0 ? "Linux" : i % 2 === 0 ? "Windows" : "MacOS",
      openPorts: i % 2 === 0 ? [
        { port: 80, service: "http" },
        { port: 443, service: "https" }
      ] : i % 3 === 0 ? [
        { port: 22, service: "ssh" }
      ] : []
    });
  }
  
  return { devices };
}

// Helper function to simulate vulnerability scan data
function simulateVulnerabilityScan(requestData: any) {
  const severities = ["Critical", "High", "Medium", "Low", "Info"];
  const totalVulnerabilities = requestData.fullScan ? 12 : 5;
  const vulnerabilities = [];
  
  for (let i = 0; i < totalVulnerabilities; i++) {
    const severityIndex = Math.min(Math.floor(Math.random() * severities.length), 4);
    
    vulnerabilities.push({
      severity: severities[severityIndex],
      issue: `Sample Vulnerability ${i + 1}`,
      description: "This is a simulated vulnerability for development purposes.",
      recommendation: "Update components to the latest version and apply security patches.",
      cve: i % 3 === 0 ? `CVE-2023-${1000 + i}` : undefined,
      cvss: i % 3 === 0 ? (Math.random() * 10).toFixed(1) : undefined,
      affectedComponents: i % 2 === 0 ? ["Frontend", "API"] : ["Database"]
    });
  }
  
  return { vulnerabilities };
}

// Helper function to simulate port scan data
function simulatePortScan(requestData: any) {
  const commonPorts = [
    { port: 21, service: "FTP", version: "vsftpd 3.0.3" },
    { port: 22, service: "SSH", version: "OpenSSH 8.2" },
    { port: 80, service: "HTTP", version: "Apache 2.4.41" },
    { port: 443, service: "HTTPS", version: "Apache 2.4.41" },
    { port: 3306, service: "MySQL", version: "MySQL 8.0.28" },
    { port: 8080, service: "HTTP-Proxy", version: "Nginx 1.18.0" }
  ];
  
  // Choose a subset of ports based on request
  const numPorts = requestData.portRange?.includes('-') || requestData.scanType === 'full' 
    ? Math.floor(Math.random() * 10) + 5 
    : Math.min(3, commonPorts.length);
  
  const ports = [];
  for (let i = 0; i < numPorts; i++) {
    ports.push({
      ...commonPorts[i % commonPorts.length],
      state: "open"
    });
  }
  
  // Generate IDS alerts if requested
  const idsAlerts = [];
  if (requestData.enableIDS) {
    const numAlerts = Math.floor(Math.random() * 3) + 1;
    const alertTypes = ["Port Scan Detected", "Unusual Connection Attempt", "Potential Exploit Attempt"];
    const severities = ["Medium", "High", "Critical", "Low"];
    
    for (let i = 0; i < numAlerts; i++) {
      idsAlerts.push({
        timestamp: new Date().toISOString(),
        severity: severities[Math.floor(Math.random() * severities.length)],
        type: alertTypes[i % alertTypes.length],
        source: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        destination: requestData.target || "192.168.1.1",
        description: "This is a simulated IDS alert for development purposes.",
        recommendation: "Investigate the source IP for potential malicious activity."
      });
    }
  }
  
  return { ports, idsAlerts };
}

// Helper function to simulate traffic analysis data
function simulateTrafficAnalysis(requestData: any) {
  const numPackets = Math.floor(Math.random() * 50) + 20;
  const packets = [];
  
  const protocols = ["TCP", "UDP", "ICMP", "HTTP", "DNS", "TLS"];
  const sources = ["192.168.1.100", "192.168.1.101", "10.0.0.1", "172.16.0.1"];
  const destinations = ["8.8.8.8", "1.1.1.1", "192.168.1.1", "204.79.197.200"];
  
  for (let i = 0; i < numPackets; i++) {
    packets.push({
      id: i + 1,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 600000)).toISOString(),
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      destination: destinations[Math.floor(Math.random() * destinations.length)],
      sourcePort: Math.floor(Math.random() * 60000) + 1024,
      destPort: [80, 443, 53, 22, 3389][Math.floor(Math.random() * 5)],
      size: Math.floor(Math.random() * 1500) + 64,
      info: "Simulated packet data"
    });
  }
  
  const stats = {
    totalPackets: numPackets,
    captureTime: requestData.duration || 60,
    dataVolume: `${Math.floor(Math.random() * 10) + 1} MB`,
    topProtocols: [
      { name: "HTTP/HTTPS", percentage: 60 },
      { name: "DNS", percentage: 20 },
      { name: "Others", percentage: 20 }
    ]
  };
  
  return { packets, stats };
}
