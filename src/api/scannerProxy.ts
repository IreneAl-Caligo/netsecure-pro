
import { supabase } from "@/integrations/supabase/client";
import type { ScannerType } from "@/services/ScannerApiService";

/**
 * Utility function to proxy scanner API requests through Supabase edge functions
 * This helps avoid CORS issues and provides a centralized place to handle API requests
 */
export async function callScannerApi(
  scanType: ScannerType,
  endpoint: string,
  apiKey: string,
  provider: string,
  data: any
) {
  try {
    console.log(`Calling ${scanType} API for provider ${provider}`);
    
    // Make the request through the Supabase edge function
    const { data: responseData, error } = await supabase.functions.invoke("security-scanner", {
      body: {
        scanType,
        endpoint,
        apiKey,
        provider,
        data
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`API Error: Failed to call scanner API: ${error.message}`);
    }

    if (!responseData) {
      throw new Error('API Error: No data received from API');
    }

    // Check if the response contains an error message
    if (responseData.error) {
      console.error('API error:', responseData.error);
      throw new Error(responseData.error || 'API Error: API request failed');
    }

    // If response contains a message indicating simulated data, pass that through
    if (responseData.message && responseData.message.includes('simulated data')) {
      console.log('Response contains simulated data');
      return responseData;
    }

    console.log(`Successfully received response from ${scanType} API`);
    return responseData;
  } catch (err: any) {
    console.error('Scanner proxy error:', err);
    throw new Error(`API Error: ${err.message || 'Failed to process API request. Please check your API key and try again.'}`);
  }
}
