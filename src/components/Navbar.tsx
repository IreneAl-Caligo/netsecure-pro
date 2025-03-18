
import { Shield, Cog } from "lucide-react";
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
          <div className="flex items-center gap-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Netsecure Pro
              </span>
            </div>
            
            {/* API Settings Button positioned to the left with minimal styling */}
            {showApiSettings && onApiSettingsClick && (
              <Button 
                onClick={onApiSettingsClick}
                variant="ghost" 
                size="sm"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <Cog className="h-4 w-4" />
                <span className="font-medium">API Settings</span>
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
