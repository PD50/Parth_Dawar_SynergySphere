import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Notification, NotificationFilters, CreateNotificationRequest, NotificationType } from '@/types/notifications';

// Mock database - replace with actual database implementation
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
  }
];

async function getUserNotifications(
  userId: string,
  filters: NotificationFilters = {},
  limit: number = 50,
  cursor?: string
): Promise<{ notifications: Notification[], hasMore: boolean, nextCursor?: string }> {
  // Filter notifications for the user
  let filteredNotifications = mockNotifications.filter(notification => notification.userId === userId);

  // Apply filters
  if (filters.type) {
    filteredNotifications = filteredNotifications.filter(notification => notification.type === filters.type);
  }

  if (filters.projectId) {
    filteredNotifications = filteredNotifications.filter(notification => notification.projectId === filters.projectId);
  }

  if (filters.isRead !== undefined) {
    filteredNotifications = filteredNotifications.filter(notification => notification.isRead === filters.isRead);
  }

  if (filters.fromDate) {
    filteredNotifications = filteredNotifications.filter(notification =>
      new Date(notification.createdAt) >= new Date(filters.fromDate!)
    );
  }

  if (filters.toDate) {
    filteredNotifications = filteredNotifications.filter(notification =>
      new Date(notification.createdAt) <= new Date(filters.toDate!)
    );
  }

  // Sort by creation date (newest first)
  filteredNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Implement pagination
  const startIndex = cursor ? filteredNotifications.findIndex(n => n.id === cursor) + 1 : 0;
  const endIndex = startIndex + limit;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  return {
    notifications: paginatedNotifications,
    hasMore: endIndex < filteredNotifications.length,
    nextCursor: paginatedNotifications.length > 0 
      ? paginatedNotifications[paginatedNotifications.length - 1].id 
      : undefined
  };
}

async function createNotification(request: CreateNotificationRequest): Promise<Notification[]> {
  const notifications: Notification[] = [];

  for (const userId of request.userIds) {
    const notification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      type: request.type,
      title: request.title,
      message: request.message,
      data: request.data,
      userId,
      fromUserId: request.fromUserId,
      projectId: request.projectId,
      isRead: false,
      createdAt: new Date()
    };

    // Add populated fields if available
    if (request.fromUserId) {
      // In a real app, fetch user from database
      notification.fromUser = {
        id: request.fromUserId,
        name: 'Unknown User',
        email: 'unknown@example.com'
      };
    }

    if (request.projectId) {
      // In a real app, fetch project from database
      notification.project = {
        id: request.projectId,
        name: 'Unknown Project'
      };
    }

    mockNotifications.push(notification);
    notifications.push(notification);
  }

  // TODO: Send real-time updates to connected clients
  // TODO: Send email/push notifications based on user preferences

  return notifications;
}

async function getUnreadCount(userId: string): Promise<number> {
  return mockNotifications.filter(notification => 
    notification.userId === userId && !notification.isRead
  ).length;
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    
    // Check if this is a request for unread count only
    if (searchParams.get('countOnly') === 'true') {
      const unreadCount = await getUnreadCount(authResult.userId);
      return NextResponse.json({ unreadCount });
    }
    
    // Parse query parameters
    const filters: NotificationFilters = {
      type: (searchParams.get('type') as NotificationType) || undefined,
      projectId: searchParams.get('projectId') || undefined,
      isRead: searchParams.get('isRead') ? searchParams.get('isRead') === 'true' : undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
    };

    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor') || undefined;

    const result = await getUserNotifications(authResult.userId, filters, limit, cursor);
    const unreadCount = await getUnreadCount(authResult.userId);

    return NextResponse.json({
      ...result,
      unreadCount
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const body: CreateNotificationRequest = await req.json();

    // Validate request body
    if (!body.type || !body.title || !body.message || !body.userIds || !Array.isArray(body.userIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, message, userIds' },
        { status: 400 }
      );
    }

    if (body.userIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      );
    }

    if (body.userIds.length > 100) {
      return NextResponse.json(
        { error: 'Too many recipients (max 100)' },
        { status: 400 }
      );
    }

    // TODO: Verify user has permission to send notifications in the specified project

    const notifications = await createNotification(body);

    return NextResponse.json(notifications, { status: 201 });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}