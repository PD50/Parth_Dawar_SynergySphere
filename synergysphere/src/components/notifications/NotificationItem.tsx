"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AtSign, 
  MessageSquare, 
  CheckSquare, 
  Users,
  Calendar,
  AlertCircle,
  TrendingUp,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Notification, NotificationType } from "@/types/notifications";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAsUnread?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  compact?: boolean;
  showActions?: boolean;
  className?: string;
}

const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  mention: AtSign,
  reply: MessageSquare,
  task_assigned: CheckSquare,
  task_completed: CheckSquare,
  task_comment: MessageSquare,
  project_invite: Users,
  project_update: TrendingUp,
  deadline_reminder: Calendar,
};

const notificationColors: Record<NotificationType, string> = {
  mention: "text-blue-600 bg-blue-50",
  reply: "text-green-600 bg-green-50",
  task_assigned: "text-orange-600 bg-orange-50",
  task_completed: "text-emerald-600 bg-emerald-50",
  task_comment: "text-purple-600 bg-purple-50",
  project_invite: "text-indigo-600 bg-indigo-50",
  project_update: "text-cyan-600 bg-cyan-50",
  deadline_reminder: "text-red-600 bg-red-50",
};

function formatNotificationTime(date: Date): string {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return formatDistanceToNow(date, { addSuffix: true });
  } else {
    return date.toLocaleDateString();
  }
}

export function NotificationItem({
  notification,
  onClick,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  compact = false,
  showActions = true,
  className
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const IconComponent = notificationIcons[notification.type];
  const colorClasses = notificationColors[notification.type];

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
    
    // Auto-mark as read when clicked
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    
    // Navigate to the notification URL if available
    if (notification.data.url) {
      window.location.href = notification.data.url;
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAsUnread = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsUnread) {
      onMarkAsUnread(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-start space-x-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer border-l-2",
        !notification.isRead ? "border-l-primary bg-primary/5" : "border-l-transparent",
        compact && "p-2",
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        colorClasses,
        compact && "w-6 h-6"
      )}>
        <IconComponent className={cn(
          "h-4 w-4",
          compact && "h-3 w-3"
        )} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h4 className={cn(
              "font-medium text-sm leading-tight",
              compact && "text-xs",
              !notification.isRead && "font-semibold"
            )}>
              {notification.title}
            </h4>
            
            {/* Message */}
            <p className={cn(
              "text-sm text-muted-foreground mt-1 line-clamp-2",
              compact && "text-xs line-clamp-1"
            )}>
              {notification.message}
            </p>

            {/* Additional context */}
            {notification.data.messageContent && !compact && (
              <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground italic border-l-2 border-muted">
                "{notification.data.messageContent.slice(0, 100)}
                {notification.data.messageContent.length > 100 ? '...' : ''}"
              </div>
            )}

            {/* Meta information */}
            <div className="flex items-center space-x-2 mt-2">
              <span className={cn(
                "text-xs text-muted-foreground",
                compact && "text-xs"
              )}>
                {formatNotificationTime(new Date(notification.createdAt))}
              </span>

              {notification.fromUser && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <div className="flex items-center space-x-1">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={notification.fromUser.avatarUrl} alt={notification.fromUser.name} />
                      <AvatarFallback className="text-xs">
                        {notification.fromUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {notification.fromUser.name}
                    </span>
                  </div>
                </>
              )}

              {notification.project && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <Badge variant="outline" className="text-xs h-4 px-1">
                    {notification.project.name}
                  </Badge>
                </>
              )}

              {!notification.isRead && (
                <div className="w-2 h-2 bg-primary rounded-full" title="Unread" />
              )}
            </div>
          </div>

          {/* Actions */}
          {showActions && (isHovered || !compact) && (
            <div className="flex-shrink-0 ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {notification.data.url && (
                    <>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        window.open(notification.data.url, '_blank');
                      }}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {notification.isRead ? (
                    <DropdownMenuItem onClick={handleMarkAsUnread}>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Mark as unread
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={handleMarkAsRead}>
                      <Eye className="h-4 w-4 mr-2" />
                      Mark as read
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}