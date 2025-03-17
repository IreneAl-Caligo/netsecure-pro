
import { Layout } from "@/components/Layout";
import Dashboard from "./Dashboard";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useEffect, useState } from "react";
import { scannerApi } from "@/services/ScannerApiService";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [apiKeysConfigured, setApiKeysConfigured] = useState({
    vulnerability: false,
    network: false,
    port: false,
    traffic: false
  });

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
      <Layout>
        <Dashboard apiKeysConfigured={apiKeysConfigured} />
      </Layout>
    </ThemeProvider>
  );
};

export default Index;
