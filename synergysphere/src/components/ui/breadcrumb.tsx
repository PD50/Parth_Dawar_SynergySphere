"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  separator?: React.ReactNode;
  maxItems?: number;
}

export function Breadcrumb({
  items,
  className,
  showHome = true,
  separator = <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />,
  maxItems = 4
}: BreadcrumbProps) {
  // Combine home with items if showHome is true
  const allItems: BreadcrumbItem[] = [
    ...(showHome ? [{ label: "Dashboard", href: "/dashboard" }] : []),
    ...items
  ];

  // Handle responsive truncation for mobile
  const displayItems = allItems.length > maxItems 
    ? [
        allItems[0], // Always show first item (Dashboard)
        { label: "...", href: undefined, isActive: false }, // Ellipsis
        ...allItems.slice(-2) // Show last 2 items
      ]
    : allItems;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-1 text-sm", className)}>
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center">
            {index > 0 && (
              <span className="mx-1 sm:mx-2" aria-hidden="true">
                {separator}
              </span>
            )}
            
            {item.href && !item.isActive ? (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center hover:text-foreground transition-colors",
                  "text-muted-foreground text-xs sm:text-sm",
                  "truncate max-w-[80px] sm:max-w-[120px] md:max-w-none"
                )}
                title={item.label}
              >
                {index === 0 && showHome ? (
                  <>
                    <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </>
                ) : (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            ) : item.label === "..." ? (
              <span className="text-muted-foreground px-1">...</span>
            ) : (
              <span
                className={cn(
                  "font-medium text-xs sm:text-sm",
                  item.isActive ? "text-foreground" : "text-muted-foreground",
                  "truncate max-w-[100px] sm:max-w-[150px] md:max-w-none"
                )}
                aria-current={item.isActive ? "page" : undefined}
                title={item.label}
              >
                {index === 0 && showHome ? (
                  <>
                    <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </>
                ) : (
                  item.label
                )}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Hook for generating breadcrumb items from current path
export function useBreadcrumbs() {
  // This would typically be used with usePathname() and project/task data
  // For now, we'll provide a utility function to help generate breadcrumbs
  const generateProjectBreadcrumbs = (
    projectId: string,
    projectName: string,
    currentPage?: string,
    taskId?: string,
    taskTitle?: string
  ): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: "Projects", href: "/dashboard/projects" },
      { label: projectName, href: `/dashboard/projects/${projectId}` }
    ];

    if (currentPage) {
      switch (currentPage) {
        case "tasks":
          items.push({ label: "Tasks", href: `/dashboard/projects/${projectId}/tasks` });
          if (taskId && taskTitle) {
            items.push({ label: taskTitle, isActive: true });
          }
          break;
        case "messages":
          items.push({ label: "Messages", isActive: true });
          break;
        case "settings":
          items.push({ label: "Settings", isActive: true });
          break;
        default:
          items.push({ label: currentPage, isActive: true });
      }
    }

    return items;
  };

  return { generateProjectBreadcrumbs };
}