
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { scannerApi } from "@/services/ScannerApiService";
import type { ScannerType } from "@/services/ScannerApiService";

interface ApiKeyConfigProps {
  scannerType: ScannerType;
  isVisible: boolean;
  onDone?: () => void;
}

export function ApiKeyConfig({ scannerType, isVisible, onDone }: ApiKeyConfigProps) {
  const [apiKey, setApiKey] = useState("");
  const [apiProvider, setApiProvider] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"untested" | "valid" | "invalid">("untested");
  const { toast } = useToast();
  
  const providers = scannerApi.getProvidersByType(scannerType);

  useEffect(() => {
    // Load existing API key & provider when component becomes visible
    if (isVisible) {
      const savedKey = scannerApi.getApiKey(scannerType);
      const savedProvider = scannerApi.getApiProvider(scannerType);
      if (savedKey) {
        setApiKey(savedKey);
      }
      if (savedProvider) {
        setApiProvider(savedProvider);
      }
    }
  }, [isVisible, scannerType]);

  const handleSaveApiKey = async () => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setKeyStatus("untested");
    
    try {
      // Test the API key
      const isValid = await scannerApi.testApiKey(scannerType, apiKey, apiProvider);
      
      if (isValid) {
        // Save the key if valid
        scannerApi.setApiKey(scannerType, apiKey, apiProvider);
        setKeyStatus("valid");
        toast({
          title: "Success",
          description: `API key for ${scannerType} scanner saved successfully`,
        });
        if (onDone) {
          onDone();
        }
      } else {
        setKeyStatus("invalid");
        toast({
          title: "Error",
          description: "API key validation failed. The key might be invalid or expired.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("API key test error:", error);
      setKeyStatus("invalid");
      toast({
        title: "Error",
        description: "Could not connect to API server. Please check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const clearApiKey = () => {
    scannerApi.clearApiKey(scannerType);
    setApiKey("");
    setApiProvider("");
    setKeyStatus("untested");
    toast({
      title: "API Key Cleared",
      description: `API key for ${scannerType} scanner has been removed`,
    });
  };

  if (!isVisible) {
    return null;
  }

  const getScannerTitle = () => {
    switch (scannerType) {
      case 'vulnerability': return 'Web Vulnerability Scanner';
      case 'network': return 'Network Scanner';
      case 'port': return 'Port Scanner';
      case 'traffic': return 'Traffic Analyzer';
      default: return 'Scanner';
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>API Configuration</span>
          <Badge variant={keyStatus === "valid" ? "secondary" : "outline"}>
            {keyStatus === "valid" ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Validated
              </>
            ) : keyStatus === "invalid" ? (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Invalid Key
              </>
            ) : (
              "Not Configured"
            )}
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure your API key for real-world {getScannerTitle()} data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select API Provider</label>
          <Select value={apiProvider} onValueChange={setApiProvider}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.name} value={provider.name}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">API Key</label>
          <div className="flex space-x-2">
            <Input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowApiKey(!showApiKey)}
              type="button"
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your API key is stored locally in your browser and never sent to our servers.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={clearApiKey} type="button">
          Clear Key
        </Button>
        <Button onClick={handleSaveApiKey} disabled={isTesting}>
          {isTesting ? "Testing..." : "Save & Test Key"}
        </Button>
      </CardFooter>
    </Card>
  );
}
