"use client";

import { useState, useEffect } from "react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  Settings,
  Trash2,
  CheckCheck,
  Filter,
  Archive
} from "lucide-react";
import { useNotificationStore } from "@/stores/notificationStore";
import { Notification, NotificationType } from "@/types/notifications";


export default function NotificationsPage() {
  const [currentUserId] = useState('1'); // TODO: Get from auth context
  const [selectedTab, setSelectedTab] = useState('all');
  
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    setNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    removeNotification,
    getNotificationsByType,
    getUnreadNotifications,
    getNotificationStats,
    setLoading,
    setError,
    setUnreadCount
  } = useNotificationStore();

  // Load notifications from API
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/notifications?limit=100');
        if (!response.ok) {
          throw new Error(`Failed to load notifications: ${response.statusText}`);
        }

        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load notifications';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [setNotifications, setLoading, setError, setUnreadCount]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        const response = await fetch(`/api/notifications/${notification.id}/read`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true })
        });

        if (response.ok) {
          markAsRead(notification.id);
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    
    if (notification.data.url) {
      window.location.href = notification.data.url;
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });

      if (response.ok) {
        markAsRead(notificationId);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAsUnread = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: false })
      });

      if (response.ok) {
        markAsUnread(notificationId);
      }
    } catch (error) {
      console.error('Failed to mark notification as unread:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        removeNotification(notificationId);
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      });

      if (response.ok) {
        markAllAsRead();
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getTabNotifications = () => {
    switch (selectedTab) {
      case 'unread':
        return getUnreadNotifications();
      case 'mentions':
        return getNotificationsByType('mention');
      case 'tasks':
        return [
          ...getNotificationsByType('task_assigned'),
          ...getNotificationsByType('task_completed'),
          ...getNotificationsByType('task_comment'),
          ...getNotificationsByType('deadline_reminder')
        ];
      default:
        return notifications;
    }
  };

  const stats = getNotificationStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay up to date with mentions, tasks, and project updates
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllRead} variant="outline">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
              {stats.unread}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unread}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mentions</CardTitle>
            <span className="text-blue-600">@</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.mention || 0}</div>
            <p className="text-xs text-muted-foreground">
              Times mentioned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.byType.task_assigned || 0) + 
               (stats.byType.task_completed || 0) + 
               (stats.byType.task_comment || 0) + 
               (stats.byType.deadline_reminder || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Task related
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                Recent activity and updates from your projects
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <div className="px-6 pt-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread" className="relative">
                  Unread
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="mentions">Mentions</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-0">
              <NotificationCenter
                notifications={getTabNotifications()}
                unreadCount={unreadCount}
                isLoading={isLoading}
                error={error}
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={handleMarkAsRead}
                onMarkAsUnread={handleMarkAsUnread}
                onMarkAllRead={handleMarkAllRead}
                onDelete={handleDelete}
                compact={false}
                className="border-0 rounded-none"
              />
            </TabsContent>

            <TabsContent value="unread" className="mt-0">
              <NotificationCenter
                notifications={getTabNotifications()}
                unreadCount={unreadCount}
                isLoading={isLoading}
                error={error}
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={handleMarkAsRead}
                onMarkAsUnread={handleMarkAsUnread}
                onMarkAllRead={handleMarkAllRead}
                onDelete={handleDelete}
                compact={false}
                className="border-0 rounded-none"
              />
            </TabsContent>

            <TabsContent value="mentions" className="mt-0">
              <NotificationCenter
                notifications={getTabNotifications()}
                unreadCount={unreadCount}
                isLoading={isLoading}
                error={error}
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={handleMarkAsRead}
                onMarkAsUnread={handleMarkAsUnread}
                onMarkAllRead={handleMarkAllRead}
                onDelete={handleDelete}
                compact={false}
                className="border-0 rounded-none"
              />
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
              <NotificationCenter
                notifications={getTabNotifications()}
                unreadCount={unreadCount}
                isLoading={isLoading}
                error={error}
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={handleMarkAsRead}
                onMarkAsUnread={handleMarkAsUnread}
                onMarkAllRead={handleMarkAllRead}
                onDelete={handleDelete}
                compact={false}
                className="border-0 rounded-none"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}