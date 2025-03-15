
import { useState } from "react";
import { Activity, RadioTower, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TrafficAnalyzer() {
  const [interface_, setInterface] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [captureTime, setCaptureTime] = useState(0);
  const [packets, setPackets] = useState<Array<{time: string; source: string; destination: string; protocol: string; length: number; info: string}>>([]);
  const { toast } = useToast();

  const startCapture = () => {
    if (!interface_) {
      toast({
        title: "Error",
        description: "Please select a network interface",
        variant: "destructive",
      });
      return;
    }

    setCapturing(true);
    setCaptureTime(0);
    setPackets([]);

    toast({
      title: "Capture Started",
      description: `Capturing traffic on ${interface_}`,
    });

    // Simulate packet capture
    const captureInterval = setInterval(() => {
      setCaptureTime(prev => prev + 1);
      
      // Randomly generate packet data
      const protocols = ["TCP", "UDP", "HTTP", "DNS", "HTTPS", "ICMP"];
      const randomProtocol = protocols[Math.floor(Math.random() * protocols.length)];
      
      const randomPort = Math.floor(Math.random() * 60000) + 1000;
      const randomLength = Math.floor(Math.random() * 1400) + 60;
      
      const newPacket = {
        time: new Date().toISOString().substring(11, 23),
        source: `192.168.1.${Math.floor(Math.random() * 254) + 1}:${randomPort}`,
        destination: `172.217.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}:${randomProtocol === "HTTP" ? 80 : randomProtocol === "HTTPS" ? 443 : randomPort}`,
        protocol: randomProtocol,
        length: randomLength,
        info: randomProtocol === "TCP" ? "SYN, ACK" : 
              randomProtocol === "DNS" ? "Standard query" : 
              randomProtocol === "HTTP" ? "GET / HTTP/1.1" :
              randomProtocol === "HTTPS" ? "Application Data" : "Echo request"
      };
      
      setPackets(prev => [newPacket, ...prev].slice(0, 100));
    }, 300);

    // Stop after 30 seconds
    setTimeout(() => {
      clearInterval(captureInterval);
      setCapturing(false);
      toast({
        title: "Capture Completed",
        description: `Captured ${packets.length} packets on ${interface_}`,
      });
    }, 30000);
  };

  const stopCapture = () => {
    setCapturing(false);
    toast({
      title: "Capture Stopped",
      description: `Captured ${packets.length} packets on ${interface_}`,
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center space-x-2">
        <Activity className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Network Traffic Analyzer</h2>
      </div>
      
      <Card className="backdrop-blur-sm bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle>Capture Configuration</CardTitle>
          <CardDescription>Select a network interface to capture packets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Select onValueChange={setInterface} value={interface_} disabled={capturing}>
              <SelectTrigger className="border-border/50 focus:border-primary">
                <SelectValue placeholder="Select interface" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eth0">eth0 (Ethernet)</SelectItem>
                <SelectItem value="wlan0">wlan0 (Wireless)</SelectItem>
                <SelectItem value="lo">lo (Loopback)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {capturing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Capturing packets...</span>
                <span>Time: {captureTime}s</span>
              </div>
              <Progress value={(captureTime / 30) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={capturing ? stopCapture : startCapture}
            className="w-full"
            variant={capturing ? "destructive" : "default"}
          >
            {capturing ? "Stop Capture" : "Start Capture"}
          </Button>
        </CardFooter>
      </Card>
      
      {packets.length > 0 && (
        <Card className="backdrop-blur-sm bg-card/80 border-border/50 animate-slide-in overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Packet Capture
            </CardTitle>
            <CardDescription>
              {packets.length} packets captured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border/50">
                <thead>
                  <tr>
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
                    <tr key={index} className={index % 2 === 0 ? 'bg-background/50' : 'bg-card/50'}>
                      <td className="px-3 py-2 text-xs">{packet.time}</td>
                      <td className="px-3 py-2 text-xs font-mono">{packet.source}</td>
                      <td className="px-3 py-2 text-xs font-mono">{packet.destination}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          packet.protocol === "TCP" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" :
                          packet.protocol === "UDP" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                          packet.protocol === "HTTP" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" :
                          packet.protocol === "HTTPS" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" :
                          packet.protocol === "DNS" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" :
                          "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                        }`}>
                          {packet.protocol}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">{packet.length}</td>
                      <td className="px-3 py-2 text-xs max-w-[200px] truncate">{packet.info}</td>
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
