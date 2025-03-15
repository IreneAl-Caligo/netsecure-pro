
import { useState } from "react";
import { Server, Layers, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function PortScanner() {
  const [target, setTarget] = useState("");
  const [scanType, setScanType] = useState("common");
  const [customPorts, setCustomPorts] = useState("80,443,22,21,25,53");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Array<{port: number; state: string; service: string; version: string}>>([]);
  const { toast } = useToast();

  const startScan = () => {
    if (!target) {
      toast({
        title: "Error",
        description: "Please enter a valid target",
        variant: "destructive",
      });
      return;
    }

    setScanning(true);
    setProgress(0);
    setResults([]);

    // Simulate scanning process
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setScanning(false);
          
          // Generate simulated results based on scan type
          const simulatedResults = [];
          
          if (scanType === "common" || scanType === "custom") {
            // Parse the ports to scan
            const portsToScan = scanType === "custom" 
              ? customPorts.split(",").map(p => parseInt(p.trim())).filter(p => !isNaN(p))
              : [80, 443, 22, 21, 25, 53, 3389, 8080];
              
            // Randomly mark some ports as open
            for (const port of portsToScan) {
              if (Math.random() > 0.7) {
                const services: Record<number, {service: string, version: string}> = {
                  21: { service: "FTP", version: "vsftpd 3.0.3" },
                  22: { service: "SSH", version: "OpenSSH 8.2p1" },
                  25: { service: "SMTP", version: "Postfix" },
                  53: { service: "DNS", version: "Bind 9.16.1" },
                  80: { service: "HTTP", version: "Apache 2.4.41" },
                  443: { service: "HTTPS", version: "Apache 2.4.41" },
                  3389: { service: "RDP", version: "Windows Terminal Services" },
                  8080: { service: "HTTP-Proxy", version: "Nginx 1.18.0" }
                };
                
                const serviceInfo = services[port] || { 
                  service: "Unknown", 
                  version: "Unknown" 
                };
                
                simulatedResults.push({
                  port,
                  state: "Open",
                  service: serviceInfo.service,
                  version: serviceInfo.version
                });
              }
            }
          } else if (scanType === "full") {
            // For full scan, generate more random ports
            const numPorts = Math.floor(Math.random() * 10) + 5;
            const commonPorts = [80, 443, 22, 21, 25, 53, 3389, 8080, 1433, 3306, 5432, 27017];
            
            for (let i = 0; i < numPorts; i++) {
              const portIndex = Math.floor(Math.random() * commonPorts.length);
              const port = commonPorts[portIndex];
              
              const services = [
                "HTTP", "HTTPS", "SSH", "FTP", "SMTP", "DNS", 
                "RDP", "HTTP-Proxy", "MSSQL", "MySQL", "PostgreSQL", "MongoDB"
              ];
              
              const versions = [
                "Apache 2.4.41", "Nginx 1.18.0", "OpenSSH 8.2p1", "vsftpd 3.0.3",
                "Postfix", "Bind 9.16.1", "Windows Terminal Services", "Squid 4.10",
                "Microsoft SQL Server 2019", "MySQL 8.0.21", "PostgreSQL 12.4", "MongoDB 4.4.1"
              ];
              
              simulatedResults.push({
                port,
                state: "Open",
                service: services[portIndex],
                version: versions[portIndex]
              });
            }
          }
          
          setResults(simulatedResults);
          
          toast({
            title: "Scan Complete",
            description: "Port scan has been completed.",
          });
          
          return 100;
        }
        return newProgress;
      });
    }, 200);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center space-x-2">
        <Layers className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Port Scanner</h2>
      </div>
      
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
    </div>
  );
}
