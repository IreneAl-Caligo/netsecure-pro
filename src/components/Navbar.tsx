
import { Shield, Settings } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

interface NavbarProps {
  activeScanner?: string | null;
  onApiSettingsClick?: () => void;
}

export function Navbar({ activeScanner, onApiSettingsClick }: NavbarProps) {
  // Track if we're on the API settings page
  const [isApiSettings, setIsApiSettings] = useState(false);
  
  // Update local state when activeScanner changes or URL hash changes
  useEffect(() => {
    const updateApiSettingsState = () => {
      const isApiSettingsPage = activeScanner === 'api-settings' || window.location.hash === '#/api-settings';
      setIsApiSettings(isApiSettingsPage);
    };
    
    updateApiSettingsState();
    
    // Listen for hash changes
    window.addEventListener('hashchange', updateApiSettingsState);
    
    return () => {
      window.removeEventListener('hashchange', updateApiSettingsState);
    };
  }, [activeScanner]);

  const handleApiSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.hash = '#/api-settings';
    
    if (onApiSettingsClick) {
      onApiSettingsClick();
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/80 border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-primary mr-2" />
            <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Netsecure Pro
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleApiSettingsClick}
              className={`ml-4 text-sm ${isApiSettings ? 'bg-accent/20 text-accent hover:text-accent' : ''}`}
            >
              <Settings className="h-4 w-4 mr-1" />
              API Settings
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
