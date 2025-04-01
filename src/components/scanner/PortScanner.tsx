import { useState, useEffect } from "react";
import { Server, Layers, AlertTriangle, Shield, Bell, Settings, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ApiKeyConfig } from "./ApiKeyConfig";
import { scannerApi } from "@/services/ScannerApiService";

interface PortScanResult {
  port: number;
  state: string;
  service: string;
  version: string;
}

interface IDSAlert {
  timestamp: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  type: string;
  source: string;
  destination: string;
  description: string;
  recommendation: string;
}

export function PortScanner() {
  const [target, setTarget] = useState("");
  const [scanType, setScanType] = useState("common");
  const [customPorts, setCustomPorts] = useState("80,443,22,21,25,53");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<PortScanResult[]>([]);
  const [idsEnabled, setIdsEnabled] = useState(true);
  const [idsAlerts, setIdsAlerts] = useState<IDSAlert[]>([]);
  const [idsMonitoring, setIdsMonitoring] = useState(false);
  const [activeTab, setActiveTab] = useState<"scan" | "ids">("scan");
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const apiKey = scannerApi.getApiKey('port');
    if (!apiKey) {
      setError("No API key configured. Real port scanning requires an API key from a security scanning service.");
    }
  }, []);

  const startScan = async () => {
    if (!target) {
      toast({
        title: "Error",
        description: "Please enter a valid target",
        variant: "destructive",
      });
      return;
    }

    const apiKey = scannerApi.getApiKey('port');
    if (!apiKey) {
      setError("No API key configured. Real port scanning requires an API key from a security scanning service.");
      setShowApiConfig(true);
      return;
    }

    setScanning(true);
    setProgress(0);
    setResults([]);
    setIdsAlerts([]);
    setError(null);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 5;
        if (newProgress >= 95) {
          return 95;
        }
        return newProgress;
      });
    }, 200);

    try {
      const portsToScan = scanType === "custom" 
        ? customPorts
        : scanType === "full" 
          ? "1-65535"
          : "21,22,23,25,53,80,110,111,135,139,143,443,445,993,995,1723,3306,3389,5900,8080";
      
      const scanData = await scannerApi.scanPorts(target, portsToScan, scanType, idsEnabled);
      
      clearInterval(interval);
      setProgress(100);
      
      if (scanData.success && scanData.ports) {
        setResults(scanData.ports);
        
        if (idsEnabled && scanData.idsAlerts) {
          setIdsAlerts(scanData.idsAlerts);
          startIDSMonitoring();
        }
        
        if (scanData.message) {
          if (scanData.ports.length === 0) {
            toast({
              title: "Scan Complete",
              description: scanData.message || "No open ports found",
            });
          } else {
            toast({
              title: "Scan Complete",
              description: `Found ${scanData.ports.length} open ports`,
            });
          }
        } else {
          toast({
            title: "Scan Complete",
            description: `Found ${scanData.ports.length} open ports`,
          });
        }
      } else {
        throw new Error(scanData.error || 'Invalid response from port scan API');
      }
    } catch (error: any) {
      console.error("API error:", error);
      
      clearInterval(interval);
      setProgress(100);
      
      if (error.message?.includes('API key')) {
        setError("Invalid or expired API key. Please update your API key in the settings.");
        setShowApiConfig(true);
      } else {
        setError(`Port scanning error: ${error.message || 'Unknown error'}`);
      }
      
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to complete port scan",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const startIDSMonitoring = () => {
    if (idsMonitoring) return;
    
    setIdsMonitoring(true);
    toast({
      title: "IDS Monitoring Enabled",
      description: "Intrusion Detection System is now monitoring for suspicious activity.",
    });
    
    // In a real implementation, this would connect to a WebSocket or Server-Sent Events endpoint
    // to receive real-time alerts from the IDS.
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300";
      case "High": return "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300";
      case "Medium": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "Low": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Port Scanner & IDS</h2>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowApiConfig(!showApiConfig)}
          className="flex items-center gap-1"
        >
          <Settings className="h-4 w-4" />
          API Settings
        </Button>
      </div>
      
      {showApiConfig && (
        <ApiKeyConfig 
          scannerType="port" 
          isVisible={showApiConfig} 
          onDone={() => {
            setShowApiConfig(false);
            setError(null);
          }}
        />
      )}
      
      {error && (
        <div className="text-sm p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-md">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          {error}
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "scan" | "ids")}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="scan">Port Scanner</TabsTrigger>
          <TabsTrigger value="ids">
            Intrusion Detection
            {idsAlerts.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-red-500 text-white">
                {idsAlerts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="scan" className="space-y-6">
          <Card className="backdrop-blur-sm bg-card/80 border-border/50">
            <CardHeader>
              <CardTitle>Scan Configuration</CardTitle>
              <CardDescription>Configure target and port options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target">Target Host or IP</Label>
                <Input
                  id="target"
                  placeholder="example.com or 192.168.1.1"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="border-border/50 focus:border-primary"
                  disabled={scanning}
                />
              </div>
              
              <Tabs defaultValue="common" value={scanType} onValueChange={setScanType} className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="common" disabled={scanning}>Common Ports</TabsTrigger>
                  <TabsTrigger value="full" disabled={scanning}>Full Scan</TabsTrigger>
                  <TabsTrigger value="custom" disabled={scanning}>Custom Ports</TabsTrigger>
                </TabsList>
                <TabsContent value="common" className="space-y-2">
                  <p className="text-sm text-muted-foreground">Scans commonly used ports (80, 443, 22, 21, 25, 53, etc.)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[80, 443, 22].map(port => (
                      <div key={port} className="flex items-center space-x-2">
                        <Checkbox id={`port-${port}`} checked disabled />
                        <Label htmlFor={`port-${port}`} className="text-sm">{port}</Label>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="full" className="space-y-2">
                  <p className="text-sm text-muted-foreground">Scans all ports from 1-65535. This can take a long time.</p>
                  <div className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 p-2 rounded-md flex items-start text-sm">
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <p>Full port scans may be detected by intrusion detection systems. Only use on systems you own or have permission to scan.</p>
                  </div>
                </TabsContent>
                <TabsContent value="custom" className="space-y-2">
                  <Label htmlFor="custom-ports">Custom Ports (comma separated)</Label>
                  <Input
                    id="custom-ports"
                    placeholder="80,443,22,8080"
                    value={customPorts}
                    onChange={(e) => setCustomPorts(e.target.value)}
                    disabled={scanning}
                  />
                </TabsContent>
              </Tabs>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="ids-mode"
                  checked={idsEnabled}
                  onCheckedChange={setIdsEnabled}
                  disabled={scanning}
                />
                <Label htmlFor="ids-mode" className="flex items-center cursor-pointer">
                  <Shield className="mr-2 h-4 w-4 text-primary" />
                  Enable IDS Monitoring
                </Label>
              </div>
              
              {scanning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Scanning ports...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={startScan} 
                disabled={scanning} 
                className="w-full"
              >
                {scanning ? "Scanning..." : "Start Scan"}
              </Button>
            </CardFooter>
          </Card>
          
          {results.length > 0 && (
            <Card className="backdrop-blur-sm bg-card/80 border-border/50 animate-slide-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Port Scan Results for {target}
                </CardTitle>
                <CardDescription>
                  {results.length} open ports detected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border/50">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Port</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">State</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Service</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Version</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {results.map((result, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-background/50' : 'bg-card/50'}>
                          <td className="px-4 py-2 text-sm font-medium">{result.port}</td>
                          <td className="px-4 py-2 text-sm">
                            <span className="flex items-center">
                              <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
                              {result.state}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm">{result.service}</td>
                          <td className="px-4 py-2 text-sm text-muted-foreground">{result.version}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="ids" className="space-y-6">
          <Card className="backdrop-blur-sm bg-card/80 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Intrusion Detection System (IDS)
              </CardTitle>
              <CardDescription>
                Monitoring for suspicious activities and potential security threats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`h-3 w-3 rounded-full ${idsMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium">
                    {idsMonitoring ? 'Active Monitoring' : 'IDS Inactive'}
                  </span>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (idsMonitoring) {
                      setIdsMonitoring(false);
                      toast({
                        title: "IDS Monitoring Stopped",
                        description: "Intrusion Detection System monitoring has been stopped."
                      });
                    } else if (target) {
                      startIDSMonitoring();
                    } else {
                      toast({
                        title: "Error",
                        description: "Please enter a target and run a scan first",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={!target && !idsMonitoring}
                >
                  {idsMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                </Button>
              </div>
              
              {idsAlerts.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                  <p className="text-muted-foreground">No intrusion alerts detected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Run a port scan with IDS enabled or start monitoring to detect potential threats
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {idsAlerts.map((alert, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border/50 bg-background/50">
                      <div className="flex items-start gap-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{alert.type}</h4>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          <p className="text-sm mt-1">{alert.description}</p>
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Source:</span> {alert.source}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Destination:</span> {alert.destination}
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-2 border-t border-border/30">
                            <h5 className="text-sm font-medium mb-1">Recommended Action:</h5>
                            <p className="text-xs text-muted-foreground">{alert.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto text-xs"
                onClick={() => setIdsAlerts([])}
                disabled={idsAlerts.length === 0}
              >
                Clear All Alerts
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
