
import { Shield, Cog, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/ThemeProvider";

interface NavbarProps {
  onApiSettingsClick?: () => void;
  showApiSettings?: boolean;
  isApiSettingsActive?: boolean;
}

export function Navbar({ 
  onApiSettingsClick, 
  showApiSettings = true, 
  isApiSettingsActive = false 
}: NavbarProps) {
  const { theme, setTheme } = useTheme();
  
  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/80 border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Netsecure Pro
              </span>
            </div>
            
            {/* API Settings as a separate button */}
            {showApiSettings && onApiSettingsClick && (
              <Button 
                onClick={onApiSettingsClick}
                variant={isApiSettingsActive ? "default" : "ghost"}
                size="sm"
                className="flex items-center gap-1.5"
              >
                <Cog className="h-4 w-4" />
                <span className="font-medium">API Settings</span>
              </Button>
            )}
          </div>
          
          {/* Theme toggle button on the right, without active/pressed state */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="hover:bg-transparent active:bg-transparent focus:bg-transparent"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
}
