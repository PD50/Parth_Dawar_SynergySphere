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

// Mock data for testing
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'mention',
    title: 'You were mentioned',
    message: 'Alice Johnson mentioned you in a message',
    data: {
      messageId: '1',
      messageContent: 'Thanks for the update @bob! The login flow is working smoothly...',
      threadId: '1',
      url: '/dashboard/projects/1/messages?thread=1'
    },
    userId: '2',
    fromUserId: '1',
    projectId: '1',
    isRead: false,
    createdAt: new Date('2024-01-25T09:15:00Z'),
    fromUser: {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@synergysphere.com',
      avatarUrl: ''
    },
    project: {
      id: '1',
      name: 'SynergySphere MVP',
      color: '#3b82f6'
    }
  },
  {
    id: '2',
    type: 'task_assigned',
    title: 'Task assigned to you',
    message: 'Alice Johnson assigned you to "Implement user authentication"',
    data: {
      taskId: '2',
      taskTitle: 'Implement user authentication',
      url: '/dashboard/projects/1/tasks?task=2'
    },
    userId: '2',
    fromUserId: '1',
    projectId: '1',
    isRead: true,
    createdAt: new Date('2024-01-24T14:30:00Z'),
    readAt: new Date('2024-01-24T15:00:00Z'),
    fromUser: {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@synergysphere.com',
      avatarUrl: ''
    },
    project: {
      id: '1',
      name: 'SynergySphere MVP',
      color: '#3b82f6'
    }
  },
  {
    id: '3',
    type: 'reply',
    title: 'New reply to your message',
    message: 'Bob Smith replied to your message in SynergySphere MVP',
    data: {
      messageId: '2',
      messageContent: 'Thanks for the update @alice! Should we schedule a review session...',
      threadId: '1',
      url: '/dashboard/projects/1/messages?thread=1'
    },
    userId: '1',
    fromUserId: '2',
    projectId: '1',
    isRead: false,
    createdAt: new Date('2024-01-25T09:20:00Z'),
    fromUser: {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@synergysphere.com',
      avatarUrl: ''
    },
    project: {
      id: '1',
      name: 'SynergySphere MVP',
      color: '#3b82f6'
    }
  },
  {
    id: '4',
    type: 'deadline_reminder',
    title: 'Task due soon',
    message: 'Your task "Database Schema Design" is due in 2 days',
    data: {
      taskId: '3',
      taskTitle: 'Database Schema Design',
      url: '/dashboard/projects/1/tasks?task=3'
    },
    userId: '3',
    projectId: '1',
    isRead: false,
    createdAt: new Date('2024-01-25T08:00:00Z'),
    project: {
      id: '1',
      name: 'SynergySphere MVP',
      color: '#3b82f6'
    }
  },
  {
    id: '5',
    type: 'project_invite',
    title: 'Project invitation',
    message: 'You were invited to join "Marketing Website" project',
    data: {
      projectId: '2',
      projectName: 'Marketing Website',
      url: '/dashboard/projects/2'
    },
    userId: '1',
    fromUserId: '1',
    projectId: '2',
    isRead: false,
    createdAt: new Date('2024-01-24T16:00:00Z'),
    fromUser: {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@synergysphere.com',
      avatarUrl: ''
    },
    project: {
      id: '2',
      name: 'Marketing Website',
      color: '#10b981'
    }
  }
];

export default function NotificationsPage() {
  const [currentUserId] = useState('1'); // Mock current user
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
    getNotificationStats
  } = useNotificationStore();

  // Load mock notifications on mount
  useEffect(() => {
    setNotifications(mockNotifications);
  }, [setNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.data.url) {
      window.location.href = notification.data.url;
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAsUnread = (notificationId: string) => {
    markAsUnread(notificationId);
  };

  const handleDelete = (notificationId: string) => {
    removeNotification(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
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