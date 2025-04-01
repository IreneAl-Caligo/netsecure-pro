
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
    // First try to use the Supabase edge function
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
      throw new Error(`Failed to call scanner API: ${error.message}`);
    }

    return responseData;
  } catch (err) {
    console.error('Scanner proxy error:', err);
    
    // If Supabase edge function fails, fall back to direct API call
    console.log('Falling back to direct API call');
    throw new Error('Failed to process API request. Please check your API key and try again.');
  }
}
