"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  CheckCheck, 
  ExternalLink,
  Filter,
  Inbox,
  Settings,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationItem } from "./NotificationItem";
import { Notification, NotificationType } from "@/types/notifications";
import { cn } from "@/lib/utils";

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  isLoading?: boolean;
  error?: string | null;
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAsUnread?: (notificationId: string) => void;
  onMarkAllRead?: () => void;
  onDelete?: (notificationId: string) => void;
  onViewAll?: () => void;
  onSettings?: () => void;
  compact?: boolean;
  className?: string;
}

const notificationTypeLabels: Record<NotificationType, string> = {
  mention: "Mentions",
  reply: "Replies",
  task_assigned: "Task Assignments",
  task_completed: "Task Completions",
  task_comment: "Task Comments",
  project_invite: "Project Invites",
  project_update: "Project Updates",
  deadline_reminder: "Deadline Reminders",
};

export function NotificationCenter({
  notifications,
  unreadCount,
  isLoading = false,
  error = null,
  onNotificationClick,
  onMarkAsRead,
  onMarkAsUnread,
  onMarkAllRead,
  onDelete,
  onViewAll,
  onSettings,
  compact = false,
  className
}: NotificationCenterProps) {
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filterType !== 'all' && notification.type !== filterType) {
      return false;
    }
    if (showOnlyUnread && notification.isRead) {
      return false;
    }
    return true;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const formatDateGroup = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getUniqueNotificationTypes = (): NotificationType[] => {
    const types = new Set(notifications.map(n => n.type));
    return Array.from(types);
  };

  if (error) {
    return (
      <div className={cn("p-4", className)}>
        <div className="text-center text-destructive">
          <p>Failed to load notifications</p>
          <Button variant="outline" size="sm" className="mt-2">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-background", !compact && "border rounded-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 px-2 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filterType === 'all'}
                onCheckedChange={() => setFilterType('all')}
              >
                All notifications
              </DropdownMenuCheckboxItem>
              {getUniqueNotificationTypes().map(type => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={filterType === type}
                  onCheckedChange={() => setFilterType(type)}
                >
                  {notificationTypeLabels[type]}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showOnlyUnread}
                onCheckedChange={setShowOnlyUnread}
              >
                Show only unread
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mark all as read */}
          {unreadCount > 0 && onMarkAllRead && (
            <Button variant="ghost" size="sm" onClick={onMarkAllRead} title="Mark all as read">
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}

          {/* Settings */}
          {onSettings && (
            <Button variant="ghost" size="sm" onClick={onSettings} title="Notification settings">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 text-center">
          <div className="inline-flex items-center space-x-2 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Loading notifications...</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredNotifications.length === 0 && (
        <div className="p-8 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">
            {notifications.length === 0 
              ? "No notifications yet" 
              : "No notifications match your filters"
            }
          </p>
          {filterType !== 'all' || showOnlyUnread ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                setFilterType('all');
                setShowOnlyUnread(false);
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      )}

      {/* Notifications */}
      {!isLoading && filteredNotifications.length > 0 && (
        <ScrollArea className={cn(
          compact ? "max-h-96" : "max-h-[500px]"
        )}>
          <div className="divide-y">
            {Object.entries(groupedNotifications).map(([dateString, dateNotifications]) => (
              <div key={dateString}>
                {!compact && (
                  <div className="px-4 py-2 bg-muted/30 border-b">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {formatDateGroup(dateString)}
                    </h4>
                  </div>
                )}
                {dateNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={onNotificationClick}
                    onMarkAsRead={onMarkAsRead}
                    onMarkAsUnread={onMarkAsUnread}
                    onDelete={onDelete}
                    compact={compact}
                    showActions={!compact}
                  />
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Footer */}
      {!compact && onViewAll && (
        <>
          <Separator />
          <div className="p-3">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground"
              onClick={onViewAll}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View all notifications
            </Button>
          </div>
        </>
      )}

      {compact && filteredNotifications.length > 5 && onViewAll && (
        <>
          <Separator />
          <div className="p-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={onViewAll}
            >
              View all {notifications.length} notifications
            </Button>
          </div>
        </>
      )}
    </div>
  );
}