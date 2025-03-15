
import { useState } from "react";
import { Wifi, Server, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

export function NetworkScanner() {
  const [ipRange, setIpRange] = useState("192.168.1.0/24");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Array<{ip: string; status: string; hostname: string; services: string}>>([]);
  const { toast } = useToast();

  const startScan = () => {
    if (!ipRange) {
      toast({
        title: "Error",
        description: "Please enter a valid IP range",
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
        const newProgress = prev + Math.random() * 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setScanning(false);
          
          // Simulate results
          setResults([
            {
              ip: "192.168.1.1",
              status: "Online",
              hostname: "router.local",
              services: "HTTP (80), SSH (22)"
            },
            {
              ip: "192.168.1.5",
              status: "Online",
              hostname: "desktop-pc.local",
              services: "SMB (445), RDP (3389)"
            },
            {
              ip: "192.168.1.10",
              status: "Online",
              hostname: "printer.local",
              services: "HTTP (80), Printer (631)"
            },
            {
              ip: "192.168.1.15",
              status: "Online",
              hostname: "mobile.local",
              services: "No open ports"
            }
          ]);
          
          toast({
            title: "Scan Complete",
            description: "Network scan has been completed.",
          });
          
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center space-x-2">
        <Wifi className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Network Scanner</h2>
      </div>
      
      <Card className="backdrop-blur-sm bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle>Scan Configuration</CardTitle>
          <CardDescription>Enter the IP range to scan (CIDR notation)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="192.168.1.0/24"
              value={ipRange}
              onChange={(e) => setIpRange(e.target.value)}
              className="border-border/50 focus:border-primary"
              disabled={scanning}
            />
          </div>
          
          {scanning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Scanning network...</span>
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
              Network Scan Results
            </CardTitle>
            <CardDescription>
              {results.length} devices found on your network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {results.map((device, index) => (
                <div key={index} className="p-4 rounded-lg border border-border/50 bg-background/50 flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <Server className="h-4 w-4" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm flex-1">
                    <div>
                      <p className="text-xs text-muted-foreground">IP Address</p>
                      <p className="font-medium">{device.ip}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-medium flex items-center">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
                        {device.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Hostname</p>
                      <p className="font-medium">{device.hostname}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Services</p>
                      <p className="font-medium">{device.services}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
