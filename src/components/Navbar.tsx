
import { Shield, Settings } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onApiSettingsClick?: () => void;
  showApiSettings?: boolean;
}

export function Navbar({ onApiSettingsClick, showApiSettings = true }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/80 border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-primary mr-2" />
            <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Netsecure Pro
            </span>
          </div>
          
          {/* API Settings Button in center */}
          {showApiSettings && onApiSettingsClick && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Button 
                onClick={onApiSettingsClick}
                variant="outline" 
                size="sm"
                className="flex items-center gap-1.5 border border-primary/20 bg-background/70 backdrop-blur-sm hover:bg-primary/10 transition-all shadow-sm"
              >
                <Settings className="h-4 w-4 text-primary" />
                <span className="font-medium">API Settings</span>
              </Button>
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
