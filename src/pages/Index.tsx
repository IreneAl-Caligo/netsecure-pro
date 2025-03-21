
import { Layout } from "@/components/Layout";
import Dashboard from "./Dashboard";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useEffect, useState } from "react";
import { scannerApi } from "@/services/ScannerApiService";
import { useToast } from "@/components/ui/use-toast";
import { ApiSettingsView } from "@/components/scanner/ApiSettingsView";

const Index = () => {
  const { toast } = useToast();
  const [apiKeysConfigured, setApiKeysConfigured] = useState({
    vulnerability: false,
    network: false,
    port: false,
    traffic: false
  });
  
  // Initialize activeScanner state based on URL hash
  const [activeScanner, setActiveScanner] = useState<string | null>(() => {
    const hash = window.location.hash;
    return hash === '#/api-settings' ? 'api-settings' : null;
  });

  // Ensure hash and state are synchronized
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const isApiSettings = hash === '#/api-settings';
      setActiveScanner(isApiSettings ? 'api-settings' : null);
    };

    // Setup event listener for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Run once on mount to ensure sync with URL
    handleHashChange();
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Update hash when activeScanner changes programmatically
  useEffect(() => {
    // Skip during initial render or if activeScanner was updated due to hash change
    if (activeScanner === 'api-settings' && window.location.hash !== '#/api-settings') {
      window.location.hash = '#/api-settings';
    } else if (activeScanner === null && window.location.hash === '#/api-settings') {
      // Only clear hash when state explicitly wants no hash
      // Use history.replaceState to avoid adding to history
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [activeScanner]);

  useEffect(() => {
    // Load saved API keys on startup
    const scannerTypes = ['vulnerability', 'network', 'port', 'traffic'] as const;
    
    // Track if keys were configured for each scanner type
    const configured = {
      vulnerability: false,
      network: false,
      port: false,
      traffic: false
    };
    
    scannerTypes.forEach(type => {
      const key = scannerApi.getApiKey(type);
      if (key) {
        console.log(`API key for ${type} scanner loaded from storage`);
        configured[type] = true;
      }
    });
    
    setApiKeysConfigured(configured);
    
    // Notify user about missing API keys
    const missingKeys = scannerTypes.filter(type => !configured[type]);
    if (missingKeys.length > 0) {
      toast({
        title: "API Keys Required",
        description: `For real-world scanning, configure API keys for: ${missingKeys.join(', ')}`,
        duration: 6000,
      });
    }
  }, [toast]);

  return (
    <ThemeProvider defaultTheme="system">
      <Layout activeScanner={activeScanner}>
        {activeScanner === 'api-settings' ? (
          <div className="container mx-auto px-4 py-10 max-w-7xl">
            <button
              onClick={() => {
                setActiveScanner(null);
                // Use history.replaceState to prevent adding to browser history
                window.history.replaceState(null, '', window.location.pathname);
              }}
              className="flex items-center text-sm font-medium hover:text-primary transition-colors mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to dashboard
            </button>
            <ApiSettingsView />
          </div>
        ) : (
          <Dashboard apiKeysConfigured={apiKeysConfigured} />
        )}
      </Layout>
    </ThemeProvider>
  );
};

export default Index;
