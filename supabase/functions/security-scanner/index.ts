
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
        JSON.stringify({ error: "Missing required parameters" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Received scan request for ${scanType} using ${provider}`);

    // Determine the base URL based on scanType and provider
    let baseUrl = '';
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
            break;
          case 'SecurityTrails':
            baseUrl = 'https://api.securitytrails.com/v1';
            break;
          case 'Censys':
            baseUrl = 'https://search.censys.io/api/v2';
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
          JSON.stringify({ error: "Invalid scan type" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    // Make the request to the external API
    try {
      console.log(`Making request to ${baseUrl}${endpoint}`);
      
      const apiResponse = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(data)
      });

      // Check if the response is ok
      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error(`API responded with status ${apiResponse.status}: ${errorText}`);
        
        return new Response(
          JSON.stringify({ 
            error: `API responded with status ${apiResponse.status}`,
            message: `The API provider returned an error. Please check your API key and request parameters.`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: apiResponse.status }
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

      // Return an error without simulated data
      return new Response(
        JSON.stringify({ 
          error: `Failed to connect to ${provider} API: ${error.message}`,
          message: "API connection failed. This could be due to an invalid API key or the service being unavailable."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }
  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    
    return new Response(
      JSON.stringify({ error: `Internal error: ${error.message}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
