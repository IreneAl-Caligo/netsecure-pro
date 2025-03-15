
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/providers/ThemeProvider";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <ThemeProvider defaultTheme="system">
      <Layout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center">
          <div className="text-center space-y-6 max-w-md mx-auto px-4">
            <h1 className="text-7xl font-bold text-primary">404</h1>
            <p className="text-2xl font-medium">Page not found</p>
            <p className="text-muted-foreground">
              The page you are looking for doesn't exist or has been moved.
            </p>
            <Button asChild className="mt-6">
              <a href="/">Back to Home</a>
            </Button>
          </div>
        </div>
      </Layout>
    </ThemeProvider>
  );
};

export default NotFound;
