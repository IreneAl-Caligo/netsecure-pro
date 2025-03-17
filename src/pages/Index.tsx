
import { Layout } from "@/components/Layout";
import Dashboard from "./Dashboard";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useEffect } from "react";
import { scannerApi } from "@/services/ScannerApiService";

const Index = () => {
  useEffect(() => {
    // Load saved API keys on startup
    const scannerTypes = ['vulnerability', 'network', 'port', 'traffic'] as const;
    scannerTypes.forEach(type => {
      const key = scannerApi.getApiKey(type);
      if (key) {
        console.log(`API key for ${type} scanner loaded from storage`);
      }
    });
  }, []);

  return (
    <ThemeProvider defaultTheme="system">
      <Layout>
        <Dashboard />
      </Layout>
    </ThemeProvider>
  );
};

export default Index;
