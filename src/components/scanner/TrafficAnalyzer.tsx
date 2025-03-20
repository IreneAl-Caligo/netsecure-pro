
import { useState, useEffect } from "react";
import { Activity, RadioTower, Zap, AlertCircle, FileDown, Wifi } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { scannerApi } from "@/services/ScannerApiService";

interface NetworkInterface {
  name: string;
  description: string;
}

interface Packet {
  id: number;
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
}

interface TrafficStats {
  totalBytes: number;
  packetsPerSecond: number;
  bytesPerSecond: number;
  protocolDistribution: {name: string; value: number}[];
  trafficOverTime: {time: string; bytes: number}[];
}

interface TrafficAnalyzerProps {
  hasApiKey?: boolean;
}

export function TrafficAnalyzer({ hasApiKey = false }: TrafficAnalyzerProps) {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [selectedInterface, setSelectedInterface] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [captureTime, setCaptureTime] = useState(0);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [stats, setStats] = useState<TrafficStats | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [captureFormat, setCaptureFormat] = useState<"live" | "pcap">("live");
  const [progress, setProgress] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [showApiSettings, setShowApiSettings] = useState(false);
  const { toast } = useToast();

  const apiProviders = scannerApi.getProvidersByType('traffic');

  useEffect(() => {
    const savedKey = scannerApi.getApiKey('traffic');
    const savedProvider = scannerApi.getApiProvider('traffic');
    
    if (savedKey) {
      setApiKey(savedKey);
    }
    
    if (savedProvider) {
      setSelectedProvider(savedProvider);
    } else if (apiProviders.length > 0) {
      setSelectedProvider(apiProviders[0].name);
    }
    
    // Default interfaces in case we can't detect any
    const mockInterfaces = [
      { name: "eth0", description: "Ethernet Adapter" },
      { name: "wlan0", description: "Wireless Adapter" },
      { name: "lo", description: "Loopback Interface" }
    ];
    
    setInterfaces(mockInterfaces);
    
    const getInterfaces = async () => {
      try {
        try {
          console.log("Attempting to get network interfaces from backend API");
          const response = await fetch('/api/network-interfaces');
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await response.json();
              if (data.interfaces && Array.isArray(data.interfaces)) {
                setInterfaces(data.interfaces);
                return;
              }
            } else {
              console.log("Response is not JSON:", contentType);
              // Response is not JSON, fallback to mock interfaces
              throw new Error("Response is not JSON");
            }
          } else {
            console.log("Backend API returned non-OK status:", response.status);
            throw new Error(`Backend API returned ${response.status}`);
          }
        } catch (e) {
          console.log("Backend API not available, using mock interfaces", e);
        }
        
        try {
          // Try to detect network interfaces using WebRTC
          console.log("Attempting to detect interfaces with WebRTC");
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          });
          
          pc.createDataChannel('');
          await pc.createOffer().then(offer => pc.setLocalDescription(offer));
          
          pc.addEventListener('icegatheringstatechange', () => {
            if (pc.iceGatheringState === 'complete') {
              if (pc.localDescription?.sdp) {
                const foundIPs: string[] = [];
                pc.localDescription.sdp.split('\n').forEach(line => {
                  if (line.indexOf('a=candidate:') === 0) {
                    const parts = line.split(' ');
                    const addr = parts[4];
                    if (addr.indexOf('.') !== -1 && !foundIPs.includes(addr)) {
                      foundIPs.push(addr);
                      console.log(`Found local IP: ${addr}`);
                      // Add to interfaces if not already there
                      setInterfaces(prev => {
                        if (!prev.some(iface => iface.name === addr)) {
                          return [...prev, { name: addr, description: "Detected Interface" }];
                        }
                        return prev;
                      });
                    }
                  }
                });
              }
            }
          });
        } catch (err) {
          console.error('Error detecting network interfaces with WebRTC:', err);
        }
      } catch (err) {
        console.error('Error detecting network interfaces:', err);
        setCaptureError("Traffic analysis requires special permissions or a dedicated packet capture tool. Browsers can't directly access network interfaces for security reasons.");
      }
    };
    
    getInterfaces();
  }, [apiProviders]);

  const handleSaveApiSettings = () => {
    scannerApi.setApiKey('traffic', apiKey, selectedProvider);
    setShowApiSettings(false);
    toast({
      title: "API Settings Saved",
      description: `Traffic analyzer now using ${selectedProvider} API`,
    });
  };

  const startCapture = async () => {
    if (!selectedInterface) {
      toast({
        title: "Error",
        description: "Please select a network interface",
        variant: "destructive",
      });
      return;
    }

    let timerInterval: ReturnType<typeof setInterval> | null = null;

    try {
      setCapturing(true);
      setCaptureTime(0);
      setProgress(0);
      setPackets([]);
      setStats(null);
      setCaptureError(null);

      toast({
        title: "Capture Started",
        description: `Started capturing traffic on ${selectedInterface}`,
      });

      timerInterval = setInterval(() => {
        setCaptureTime(prev => prev + 1);
      }, 1000);

      try {
        console.log("Attempting to capture traffic from backend API");
        let response;
        try {
          response = await fetch(`/api/capture-traffic`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              interface: selectedInterface,
              format: captureFormat
            })
          });
        } catch (e) {
          console.log("Backend API not available, trying external services", e);
        }
        
        if (!response || !response.ok) {
          console.log("Attempting to use external API for traffic capture");
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          
          if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
          }
          
          // Actually use the scannerApi service instead of making direct fetch calls
          try {
            const baseUrl = scannerApi.getBaseUrl('traffic');
            const provider = scannerApi.getApiProvider('traffic');
            console.log(`Using ${provider} API at ${baseUrl} for traffic capture`);
            
            response = await fetch(`${baseUrl}/capture`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                interface: selectedInterface,
                format: captureFormat,
                duration: 300
              })
            });
          } catch (e) {
            console.error("External API not available:", e);
            throw e;
          }
        }
        
        if (response && response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const reader = response.body?.getReader();
            
            if (!reader) {
              throw new Error('Stream reader not available');
            }
            
            const processPackets = async () => {
              try {
                const { done, value } = await reader.read();
                if (done) {
                  return;
                }
                
                const packetData = JSON.parse(new TextDecoder().decode(value));
                setPackets(prev => [packetData, ...prev].slice(0, 1000));
                updateStats();
                
                await processPackets();
              } catch (e) {
                console.error('Error processing packet:', e);
                throw e;
              }
            };
            
            await processPackets();
          } else {
            console.log("Response is not JSON:", contentType);
            throw new Error("Response is not JSON");
          }
        } else {
          throw new Error('Failed to access packet capture API');
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
        stopCapture();
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        setCaptureError("Traffic capture interrupted");
        toast({
          title: "Capture Interrupted",
          description: "Unable to capture network traffic",
          variant: "destructive",
        });
      }
      
      // Auto-stop after 5 minutes to prevent excessive resource usage
      setTimeout(() => {
        if (capturing) {
          stopCapture();
          if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
          }
        }
      }, 5 * 60 * 1000);
    } catch (err) {
      console.error("Error during traffic capture:", err);
      setCaptureError("Traffic capture interrupted");
      toast({
        title: "Capture Interrupted",
        description: "Unable to capture network traffic",
        variant: "destructive",
      });
      setCapturing(false);
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    };
  };

  const stopCapture = () => {
    setCapturing(false);
    updateStats();
    toast({
      title: "Capture Stopped",
      description: `Captured ${packets.length} packets`,
    });
  };
  
  const updateStats = () => {
    if (!packets.length) return;
    
    const totalBytes = packets.reduce((sum, packet) => sum + packet.length, 0);
    const packetsPerSecond = packets.length / Math.max(captureTime, 1);
    const bytesPerSecond = totalBytes / Math.max(captureTime, 1);
    
    const protocolCounts: Record<string, number> = {};
    packets.forEach(packet => {
      protocolCounts[packet.protocol] = (protocolCounts[packet.protocol] || 0) + 1;
    });
    
    const protocolDistribution = Object.keys(protocolCounts).map(protocol => ({
      name: protocol,
      value: protocolCounts[protocol]
    })).sort((a, b) => b.value - a.value);
    
    const now = new Date();
    const timePoints: Record<string, number> = {};
    
    // Create time points for the last 60 seconds
    for (let i = 0; i < 60; i++) {
      const time = new Date(now.getTime() - (i * 1000));
      const timeStr = time.toISOString().substring(11, 19);
      timePoints[timeStr] = 0;
    }
    
    // Fill in the data for each time point
    packets.forEach(packet => {
      const packetTime = packet.timestamp.substring(0, 8);
      if (timePoints[packetTime] !== undefined) {
        timePoints[packetTime] += packet.length;
      }
    });
    
    const trafficOverTime = Object.entries(timePoints)
      .map(([time, bytes]) => ({ time, bytes }))
      .reverse();
    
    setStats({
      totalBytes,
      packetsPerSecond,
      bytesPerSecond,
      protocolDistribution,
      trafficOverTime
    });
  };
  
  const downloadCapture = () => {
    if (!packets.length) return;
    
    const captureData = {
      interface: selectedInterface,
      duration: captureTime,
      packetCount: packets.length,
      packets: packets
    };
    
    try {
      console.log("Attempting to download capture via backend API");
      fetch('/api/download-capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(captureData)
      })
      .then(response => {
        if (!response.ok) {
          console.log("Backend API returned non-OK status:", response.status);
          throw new Error('Failed to download');
        }
        return response.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `traffic_capture_${new Date().toISOString().replace(/:/g, '-')}.pcap`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Capture Downloaded",
          description: "Traffic capture saved as PCAP file",
        });
      })
      .catch(err => {
        console.error("Download API error:", err);
        fallbackDownload();
      });
    } catch (e) {
      console.error("Download API not available:", e);
      fallbackDownload();
    }
    
    function fallbackDownload() {
      console.log("Using fallback download method (JSON format)");
      const blob = new Blob([JSON.stringify(captureData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `traffic_capture_${new Date().toISOString().replace(/:/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Capture Downloaded",
        description: "Traffic capture saved as JSON file",
      });
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#45B39D', '#F5B041'];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center space-x-2">
        <Activity className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Network Traffic Analyzer</h2>
      </div>
      
      {showApiSettings ? (
        <Card className="backdrop-blur-sm bg-card/80 border-border/50">
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Configure your traffic analyzer API provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="api-provider" className="text-sm font-medium">API Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger id="api-provider" className="w-full">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {apiProviders.map((provider) => (
                    <SelectItem key={provider.name} value={provider.name}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="traffic-api-key" className="text-sm font-medium">API Key</label>
              <Input
                id="traffic-api-key"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                API key for {selectedProvider || "selected provider"} traffic analysis service
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowApiSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiSettings}>
              Save API Settings
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="backdrop-blur-sm bg-card/80 border-border/50">
          <CardHeader>
            <CardTitle>Capture Configuration</CardTitle>
            <CardDescription>Select a network interface to capture packets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="interface-select" className="text-sm font-medium">Network Interface</label>
              <Select 
                onValueChange={setSelectedInterface} 
                value={selectedInterface} 
                disabled={capturing}
              >
                <SelectTrigger id="interface-select" className="border-border/50 focus:border-primary">
                  <SelectValue placeholder="Select interface" />
                </SelectTrigger>
                <SelectContent>
                  {interfaces.map((iface) => (
                    <SelectItem key={iface.name} value={iface.name}>
                      {iface.name} ({iface.description})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
              <div className="space-y-2">
                <label className="text-sm font-medium">Capture Format</label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="live"
                      value="live"
                      checked={captureFormat === "live"}
                      onChange={() => setCaptureFormat("live")}
                      disabled={capturing}
                      className="mr-2"
                    />
                    <label htmlFor="live" className="text-sm">Live Capture</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="pcap"
                      value="pcap"
                      checked={captureFormat === "pcap"}
                      onChange={() => setCaptureFormat("pcap")}
                      disabled={capturing}
                      className="mr-2"
                    />
                    <label htmlFor="pcap" className="text-sm">PCAP File</label>
                  </div>
                </div>
              </div>
              
              <div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowApiSettings(true)}
                >
                  API Settings
                </Button>
              </div>
            </div>
            
            {apiKey ? (
              <div className="text-sm px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md">
                Using {selectedProvider || "default"} API for traffic analysis
              </div>
            ) : (
              <div className="text-sm px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-md">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                No API key configured. Traffic capture may not work properly.
              </div>
            )}
            
            {captureError && (
              <div className="text-sm p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-md">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                {captureError}
              </div>
            )}
            
            {capturing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Capturing packets...</span>
                  <span>Time: {captureTime}s</span>
                </div>
                <Progress value={Math.min((captureTime / 300) * 100, 100)} className="h-2" />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button 
              onClick={capturing ? stopCapture : startCapture}
              className={capturing ? "bg-destructive hover:bg-destructive/90" : ""}
              disabled={!selectedInterface}
            >
              {capturing ? "Stop Capture" : "Start Capture"}
            </Button>
            
            {packets.length > 0 && (
              <Button 
                onClick={downloadCapture}
                variant="outline"
                className="flex items-center gap-1"
              >
                <FileDown className="h-4 w-4" />
                Download Capture
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
      
      {packets.length > 0 && (
        <>
          {stats && (
            <Card className="backdrop-blur-sm bg-card/80 border-border/50 animate-slide-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RadioTower className="h-5 w-5 text-primary" />
                  Traffic Statistics
                </CardTitle>
                <CardDescription>
                  Analysis of captured network traffic
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                    <p className="text-sm text-muted-foreground">Total Data</p>
                    <p className="text-2xl font-semibold">
                      {stats.totalBytes > 1024 * 1024 
                        ? `${(stats.totalBytes / (1024 * 1024)).toFixed(2)} MB` 
                        : `${(stats.totalBytes / 1024).toFixed(2)} KB`}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                    <p className="text-sm text-muted-foreground">Packets/Second</p>
                    <p className="text-2xl font-semibold">{Math.round(stats.packetsPerSecond)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                    <p className="text-sm text-muted-foreground">Bandwidth</p>
                    <p className="text-2xl font-semibold">
                      {stats.bytesPerSecond > 1024 * 1024 
                        ? `${(stats.bytesPerSecond / (1024 * 1024)).toFixed(2)} MBps` 
                        : `${(stats.bytesPerSecond / 1024).toFixed(2)} KBps`}
                    </p>
                  </div>
                </div>
                
                <Tabs defaultValue="traffic">
                  <TabsList className="mb-4">
                    <TabsTrigger value="traffic">Traffic Over Time</TabsTrigger>
                    <TabsTrigger value="protocols">Protocol Distribution</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="traffic">
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={stats.trafficOverTime}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis 
                            dataKey="time" 
                            tick={{ fontSize: 12 }} 
                            tickFormatter={(tick) => tick.substring(0, 5)}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }} 
                            tickFormatter={(tick) => `${(tick / 1024).toFixed(1)}K`}
                          />
                          <Tooltip 
                            formatter={(value: number) => `${(value / 1024).toFixed(2)} KB`} 
                            labelFormatter={(label) => `Time: ${label}`}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="bytes" 
                            stroke="var(--primary)" 
                            fill="var(--primary)" 
                            fillOpacity={0.3} 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="protocols">
                    <div className="h-80 w-full flex flex-col md:flex-row">
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.protocolDistribution.slice(0, 8)}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {stats.protocolDistribution.slice(0, 8).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} packets`, 'Count']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 flex items-center">
                        <div className="grid grid-cols-2 gap-2 w-full">
                          {stats.protocolDistribution.slice(0, 8).map((entry, index) => (
                            <div key={index} className="flex items-center text-sm">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span>{entry.name}: {entry.value} packets</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        
          <Card className="backdrop-blur-sm bg-card/80 border-border/50 animate-slide-in overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Packet Capture
              </CardTitle>
              <CardDescription>
                {packets.length} packets captured on {selectedInterface}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6">
                <table className="min-w-full divide-y divide-border/50">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Destination</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Protocol</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Length</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {packets.map((packet, index) => (
                      <tr key={packet.id} className={index % 2 === 0 ? 'bg-background/50' : 'bg-card/50'}>
                        <td className="px-3 py-2 text-xs">{packet.id}</td>
                        <td className="px-3 py-2 text-xs">{packet.timestamp}</td>
                        <td className="px-3 py-2 text-xs font-mono">{packet.source}</td>
                        <td className="px-3 py-2 text-xs font-mono">{packet.destination}</td>
                        <td className="px-3 py-2 text-xs">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            packet.protocol === "TCP" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" :
                            packet.protocol === "UDP" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                            packet.protocol === "HTTP" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" :
                            packet.protocol === "HTTPS" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" :
                            packet.protocol === "DNS" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" :
                            packet.protocol === "ICMP" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
                            packet.protocol === "TLS" ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300" :
                            packet.protocol === "ARP" ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" :
                            "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                          }`}>
                            {packet.protocol}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs">{packet.length}</td>
                        <td className="px-3 py-2 text-xs max-w-[300px] truncate">{packet.info}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
