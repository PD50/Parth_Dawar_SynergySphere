"use client";

import { cn } from "@/lib/utils";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r bg-muted/40 lg:flex">
          <Sidebar />
        </aside>
        <main className={cn("flex-1", className)}>
          <div className="container mx-auto p-3 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}