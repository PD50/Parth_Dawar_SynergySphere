"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import { Moon, Sun } from "lucide-react";
import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
  title: string;
  description: string;
}

export function AuthLayout({ 
  children, 
  className, 
  title, 
  description 
}: AuthLayoutProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted flex-col justify-between p-10">
        <div className="flex items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            S
          </div>
          <span className="ml-2 font-bold text-xl">SynergySphere</span>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Streamline your team collaboration
          </h1>
          <p className="text-xl text-muted-foreground">
            Connect, collaborate, and create amazing things together with AI-powered insights and seamless project management.
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          © 2024 SynergySphere. All rights reserved.
        </div>
      </div>

      {/* Right side - Authentication form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                S
              </div>
              <span className="ml-2 font-bold text-2xl">SynergySphere</span>
            </Link>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            
            <div className={cn("space-y-4", className)}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}