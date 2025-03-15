
import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScannerCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  className?: string;
  onClick: () => void;
}

export function ScannerCard({ title, description, icon, className, onClick }: ScannerCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden card-transition cursor-pointer border border-border/50",
      "hover:border-primary/20 hover:shadow-md hover:shadow-primary/5",
      "dark:bg-card/50 dark:backdrop-blur-sm",
      className
    )}>
      <CardHeader className="space-y-1 p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <div className="text-primary">{icon}</div>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="rounded-md bg-secondary/50 dark:bg-secondary/20 p-3">
          <p className="text-xs text-muted-foreground">
            Scan for security vulnerabilities and ensure your network is protected.
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button 
          variant="default" 
          className="w-full transition-all duration-300 hover:shadow-md"
          onClick={onClick}
        >
          Start Scan
        </Button>
      </CardFooter>
    </Card>
  );
}
