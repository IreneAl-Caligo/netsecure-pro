
import { Layout } from "@/components/Layout";
import Dashboard from "./Dashboard";
import { ThemeProvider } from "@/providers/ThemeProvider";

const Index = () => {
  return (
    <ThemeProvider defaultTheme="system">
      <Layout>
        <Dashboard />
      </Layout>
    </ThemeProvider>
  );
};

export default Index;
