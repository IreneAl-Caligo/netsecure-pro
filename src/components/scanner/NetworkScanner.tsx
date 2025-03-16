import { useState, useEffect } from "react";
import { Wifi, Server, Network, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface NetworkDevice {
  ip: string;
  mac?: string;
  hostname?: string;
  status: "Online" | "Offline";
  vendor?: string;
  os?: string;
  openPorts?: {port: number; service: string}[];
}

export function NetworkScanner() {
  const [ipRange, setIpRange] = useState("192.168.1.0/24");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<NetworkDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanMethod, setScanMethod] = useState<"arp" | "ping" | "full">("arp");
  const { toast } = useToast();

  // Check if browser supports required WebRTC APIs for local network scanning
  useEffect(() => {
    const checkCapabilities = () => {
      if (!navigator.mediaDevices || typeof RTCPeerConnection === 'undefined') {
        setError("Your browser does not support the WebRTC APIs needed for network scanning. Try using Chrome or Firefox.");
      }
    };
    
    checkCapabilities();
  }, []);

  const validateIpRange = (range: string): boolean => {
    // Basic validation for IP range format
    const ipCidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    if (!ipCidrRegex.test(range)) {
      return false;
    }
    
    // Check if the IP parts are valid (0-255)
    const ipPart = range.split('/')[0];
    const octets = ipPart.split('.');
    
    for (const octet of octets) {
      const num = parseInt(octet, 10);
      if (isNaN(num) || num < 0 || num > 255) {
        return false;
      }
    }
    
    // Check if CIDR is valid (0-32)
    const cidr = parseInt(range.split('/')[1], 10);
    if (isNaN(cidr) || cidr < 0 || cidr > 32) {
      return false;
    }
    
    return true;
  };

  const startScan = async () => {
    if (!validateIpRange(ipRange)) {
      toast({
        title: "Error",
        description: "Please enter a valid IP range in CIDR notation (e.g., 192.168.1.0/24)",
        variant: "destructive",
      });
      return;
    }

    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      setScanning(true);
      setProgress(0);
      setResults([]);
      setError(null);

      toast({
        title: "Scan Started",
        description: `Starting network scan of ${ipRange}`,
      });

      // Start progress visualization
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            if (progressInterval) {
              clearInterval(progressInterval);
              progressInterval = null;
            }
            return 95;
          }
          return prev + (Math.random() * 3);
        });
      }, 500);

      try {
        // Attempt to actually scan the network
        // This uses the browser's WebRTC to get local IP, then fetches /api/network-scan
        const response = await fetch('/api/network-scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ipRange,
            scanMethod
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error during network scan');
        }

        const scanData = await response.json();
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        setProgress(100);
        
        if (scanData.devices && Array.isArray(scanData.devices)) {
          setResults(scanData.devices);
        } else {
          throw new Error('Invalid response from network scan API');
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
        
        // Use WebRTC to try and get local IP
        try {
          const peerConnection = new RTCPeerConnection({ 
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] 
          });
          
          peerConnection.createDataChannel('');
          peerConnection.createOffer().then(offer => peerConnection.setLocalDescription(offer));
          
          let localIP: string | null = null;
          
          peerConnection.addEventListener('icegatheringstatechange', () => {
            if (peerConnection.iceGatheringState === 'complete') {
              peerConnection.localDescription?.sdp.split('\n').forEach(line => {
                if (line.indexOf('a=candidate:') === 0) {
                  const parts = line.split(' ');
                  const addr = parts[4];
                  if (addr.indexOf('.') !== -1 && !localIP) {
                    localIP = addr;
                    console.log('Found local IP:', localIP);
                    
                    // Use the local IP to initiate an alternative scanning method
                    fetch(`https://api.networkscan.io/scan?ip=${encodeURIComponent(localIP)}&range=${ipRange}`, {
                      headers: {
                        'Authorization': 'Bearer YOUR_API_KEY' // In a real app, this would be from environment or user input
                      }
                    })
                    .then(response => response.json())
                    .then(data => {
                      if (data.success && data.devices) {
                        setResults(data.devices);
                      }
                    })
                    .catch(err => {
                      console.error('Alternative API scan failed:', err);
                      setError("Network scanning requires special permissions. Please install a dedicated network scanning tool for accurate results.");
                    })
                    .finally(() => {
                      if (progressInterval) {
                        clearInterval(progressInterval);
                        progressInterval = null;
                      }
                      setProgress(100);
                    });
                  }
                }
              });
              
              if (!localIP) {
                throw new Error('Could not determine local IP address');
              }
            }
          });
        } catch (webrtcError) {
          console.error('WebRTC Error:', webrtcError);
          setError("Network scanning requires special permissions or extensions in web browsers. For security reasons, browsers restrict direct network access.");
          
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          setProgress(100);
        }
      }
    } catch (err) {
      console.error("Error during network scan:", err);
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      setScanning(false);
      setError("An unexpected error occurred. Network scanning requires special permissions in web browsers.");
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
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
            <p className="text-xs text-muted-foreground">
              Note: Only scan networks you own or have explicit permission to test.
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Scan Method</label>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={scanMethod === "arp" ? "default" : "outline"} 
                className="cursor-pointer"
                onClick={() => !scanning && setScanMethod("arp")}
              >
                ARP Scan (Fast)
              </Badge>
              <Badge 
                variant={scanMethod === "ping" ? "default" : "outline"} 
                className="cursor-pointer"
                onClick={() => !scanning && setScanMethod("ping")}
              >
                Ping Sweep
              </Badge>
              <Badge 
                variant={scanMethod === "full" ? "default" : "outline"} 
                className="cursor-pointer"
                onClick={() => !scanning && setScanMethod("full")}
              >
                Full Scan (Slow)
              </Badge>
            </div>
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
          
          {error && (
            <div className="text-sm p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-md">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              {error}
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
              <Network className="h-5 w-5 text-primary" />
              Network Scan Results
            </CardTitle>
            <CardDescription>
              {results.length} devices found on your network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="devices">
              <TabsList className="mb-4">
                <TabsTrigger value="devices">Devices</TabsTrigger>
                <TabsTrigger value="map">Network Map</TabsTrigger>
              </TabsList>
              
              <TabsContent value="devices" className="grid gap-4">
                {results.map((device, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border/50 bg-background/50">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-2 rounded-full text-primary">
                        <Server className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {device.ip}
                              <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {device.hostname || "Unknown"}
                              {device.vendor && ` • ${device.vendor}`}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            {device.mac && (
                              <p className="font-mono text-xs">{device.mac}</p>
                            )}
                            {device.os && (
                              <p className="text-xs text-muted-foreground">{device.os}</p>
                            )}
                          </div>
                        </div>
                        
                        {device.openPorts && device.openPorts.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/30">
                            <p className="text-xs text-muted-foreground mb-1">Open Ports:</p>
                            <div className="flex flex-wrap gap-1">
                              {device.openPorts.map((port, idx) => (
                                <span key={idx} className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                  {port.port}/{port.service}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="map">
                <div className="rounded-lg border border-border/50 p-4 bg-background/50 text-center">
                  <Network className="h-16 w-16 mx-auto text-primary mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Network map visualization requires advanced permissions or a backend service.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
