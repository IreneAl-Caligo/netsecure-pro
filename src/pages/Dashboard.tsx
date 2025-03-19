
import { useState } from "react";
import { Shield, Wifi, Activity, Layers } from "lucide-react";
import { ScannerCard } from "@/components/scanner/ScannerCard";
import { WebVulnerabilityScanner } from "@/components/scanner/WebVulnerabilityScanner";
import { NetworkScanner } from "@/components/scanner/NetworkScanner";
import { TrafficAnalyzer } from "@/components/scanner/TrafficAnalyzer";
import { PortScanner } from "@/components/scanner/PortScanner";
import { ApiSettingsView } from "@/components/scanner/ApiSettingsView";
import { scannerApi } from "@/services/ScannerApiService";
import { Navbar } from "@/components/Navbar";
import type { ScannerType } from "@/services/ScannerApiService";

interface DashboardProps {
  apiKeysConfigured?: {
    vulnerability: boolean;
    network: boolean;
    port: boolean;
    traffic: boolean;
  };
}

export default function Dashboard({ apiKeysConfigured }: DashboardProps) {
  const [activeScanner, setActiveScanner] = useState<string | null>(null);
  
  // Check if we have API keys configured for each scanner type
  const vulnerabilityKey = scannerApi.getApiKey('vulnerability');
  const networkKey = scannerApi.getApiKey('network');
  const portKey = scannerApi.getApiKey('port');
  const trafficKey = scannerApi.getApiKey('traffic');
  
  const scanners = [
    {
      id: "web-vulnerability",
      title: "Web Vulnerability Scanner",
      description: "Scan websites for security vulnerabilities",
      icon: <Shield className="h-5 w-5" />,
      component: <WebVulnerabilityScanner />
    },
    {
      id: "network-scanner",
      title: "Network Scanner",
      description: "Discover devices on your network",
      icon: <Wifi className="h-5 w-5" />,
      component: <NetworkScanner />
    },
    {
      id: "traffic-analyzer",
      title: "Traffic Analyzer",
      description: "Analyze network traffic and packet data",
      icon: <Activity className="h-5 w-5" />,
      component: <TrafficAnalyzer />
    },
    {
      id: "port-scanner",
      title: "Port Scanner",
      description: "Scan for open ports on target systems",
      icon: <Layers className="h-5 w-5" />,
      component: <PortScanner />
    }
  ];
  
  return (
    <>
      <Navbar 
        onApiSettingsClick={() => setActiveScanner('api-settings')} 
        showApiSettings={true} 
      />
      <div className="container mx-auto px-4 py-8 max-w-7xl transition-all duration-500">
        {!activeScanner ? (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {scanners.map((scanner) => (
                <ScannerCard
                  key={scanner.id}
                  title={scanner.title}
                  description={scanner.description}
                  icon={scanner.icon}
                  onClick={() => setActiveScanner(scanner.id)}
                  className="animate-scale-in"
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <button
              onClick={() => setActiveScanner(null)}
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
            
            {activeScanner === 'api-settings' ? <ApiSettingsView /> : 
             scanners.find(scanner => scanner.id === activeScanner)?.component}
          </div>
        )}
      </div>
    </>
  );
}
