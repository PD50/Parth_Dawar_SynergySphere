"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, BellRing } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import { useNotificationStore } from "@/stores/notificationStore";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function NotificationBell({ 
  className, 
  variant = "ghost",
  size = "default" 
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  const {
    unreadCount,
    notifications,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    setLoading,
    setError
  } = useNotificationStore();

  // Fetch notifications on mount and periodically
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        // In a real app, this would be an API call
        // const response = await fetch('/api/notifications');
        // const data = await response.json();
        
        // Mock implementation - notifications are already in the store
        console.log('Fetching notifications...');
      } catch (err) {
        setError('Failed to fetch notifications');
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [setLoading, setError]);

  // Detect new notifications
  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotifications(true);
      
      // Clear the "new" indicator after a few seconds
      const timeout = setTimeout(() => {
        setHasNewNotifications(false);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [unreadCount]);

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setHasNewNotifications(false);
    }
  };

  const BellIcon = hasNewNotifications ? BellRing : Bell;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={cn(
            "relative",
            hasNewNotifications && "animate-pulse",
            className
          )}
        >
          <BellIcon className={cn(
            "h-5 w-5",
            size === "sm" && "h-4 w-4",
            size === "lg" && "h-6 w-6"
          )} />
          
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs min-w-[20px]",
                size === "sm" && "h-4 w-4 -top-0.5 -right-0.5 text-xs",
                size === "lg" && "h-6 w-6 -top-1.5 -right-1.5"
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={8}
      >
        <NotificationCenter
          notifications={notifications.slice(0, 20)} // Show latest 20
          unreadCount={unreadCount}
          isLoading={isLoading}
          error={error}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllRead}
          onViewAll={() => {
            setIsOpen(false);
            // Navigate to full notifications page
            window.location.href = '/dashboard/notifications';
          }}
          compact={true}
        />
      </PopoverContent>
    </Popover>
  );
}