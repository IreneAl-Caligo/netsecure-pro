
import { ReactNode } from "react";
import { Navbar } from "./Navbar";

interface LayoutProps {
  children: ReactNode;
  activeScanner?: string | null;
}

export function Layout({ children, activeScanner }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar activeScanner={activeScanner} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
