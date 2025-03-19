
import { Cog } from "lucide-react";
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
          <div className="flex-1 flex items-center">
            {/* Only the top Netsecure Pro text and shield will remain */}
          </div>
          
          {/* API Settings Button positioned in the center where the removed content was */}
          <div className="flex-1 flex justify-center">
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
          
          {/* Empty div to maintain the flex layout (theme toggle removed) */}
          <div className="flex-1 flex justify-end">
            {/* Theme toggle removed */}
          </div>
        </div>
      </div>
    </nav>
  );
}
