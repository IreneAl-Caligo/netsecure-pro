
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiKeyConfig } from "./ApiKeyConfig";
import { scannerApi } from "@/services/ScannerApiService";
import { CheckCircle, Settings, Key } from "lucide-react";

export function ApiSettingsView() {
  const [activeTab, setActiveTab] = useState<string>("vulnerability");
  const [showConfig, setShowConfig] = useState<Record<string, boolean>>({
    vulnerability: false,
    network: false,
    port: false,
    traffic: false
  });

  const toggleConfig = (scannerType: string) => {
    setShowConfig(prev => ({
      ...prev,
      [scannerType]: !prev[scannerType]
    }));
  };

  const handleConfigDone = (scannerType: string) => {
    toggleConfig(scannerType);
  };

  const getApiStatus = (scannerType: string) => {
    const key = scannerApi.getApiKey(scannerType);
    const provider = scannerApi.getApiProvider(scannerType);
    return {
      configured: !!key,
      provider: provider
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">API Settings</h2>
      </div>

      <Card className="backdrop-blur-sm bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle>Scanner API Configuration</CardTitle>
          <CardDescription>
            Configure API keys for different security scanning tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="vulnerability">Vulnerability</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="traffic">Traffic</TabsTrigger>
              <TabsTrigger value="port">Port</TabsTrigger>
            </TabsList>

            {["vulnerability", "network", "traffic", "port"].map((scannerType) => {
              const { configured, provider } = getApiStatus(scannerType);
              return (
                <TabsContent key={scannerType} value={scannerType} className="space-y-4">
                  {showConfig[scannerType] ? (
                    <ApiKeyConfig 
                      scannerType={scannerType as any} 
                      isVisible={true} 
                      onDone={() => handleConfigDone(scannerType)}
                    />
                  ) : (
                    <div className="p-4 border border-border/50 rounded-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <h3 className="text-lg font-medium">
                            {scannerType.charAt(0).toUpperCase() + scannerType.slice(1)} Scanner API
                          </h3>
                          {configured ? (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              <span>
                                Using {provider || "default provider"}
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No API key configured
                            </p>
                          )}
                        </div>
                        <Badge variant={configured ? "secondary" : "outline"}>
                          {configured ? "Configured" : "Not Configured"}
                        </Badge>
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => toggleConfig(scannerType)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Key className="h-4 w-4" />
                          {configured ? "Edit Key" : "Configure API"}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="text-sm space-y-2">
                    <h4 className="font-medium">Available API Providers:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {scannerApi.getProvidersByType(scannerType as any).map((provider, index) => (
                        <div key={index} className="p-3 border border-border/50 rounded-md bg-background/50">
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-xs text-muted-foreground">
                            API Endpoint: {provider.url}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
