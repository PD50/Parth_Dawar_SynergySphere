import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationFilters, CreateNotificationRequest, NotificationType } from '@/types/notifications';

async function getUserNotifications(
  userId: string,
  filters: NotificationFilters = {},
  limit: number = 50,
  cursor?: string
) {
  const where: any = {
    userId,
  };

  // Apply filters
  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.projectId) {
    where.projectId = filters.projectId;
  }

  if (filters.isRead !== undefined) {
    where.isRead = filters.isRead;
  }

  if (filters.fromDate) {
    where.createdAt = {
      ...where.createdAt,
      gte: new Date(filters.fromDate),
    };
  }

  if (filters.toDate) {
    where.createdAt = {
      ...where.createdAt,
      lte: new Date(filters.toDate),
    };
  }

  // Cursor-based pagination
  const cursorCondition = cursor ? { id: cursor } : undefined;

  const notifications = await prisma.notification.findMany({
    where,
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit + 1, // Take one extra to check if there are more
    cursor: cursorCondition,
    skip: cursor ? 1 : 0, // Skip the cursor item
  });

  const hasMore = notifications.length > limit;
  const items = hasMore ? notifications.slice(0, limit) : notifications;

  // Transform to match our Notification interface
  const transformedNotifications = items.map((notification: any) => ({
    id: notification.id,
    type: notification.type as NotificationType,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    userId: notification.userId,
    fromUserId: notification.fromUserId,
    projectId: notification.projectId,
    isRead: notification.isRead,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    fromUser: notification.fromUser,
    project: notification.project ? {
      id: notification.project.id,
      name: notification.project.name,
      color: undefined, // Could be added to project model
    } : undefined,
  }));

  return {
    notifications: transformedNotifications,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1].id : undefined,
  };
}

async function createNotifications(request: CreateNotificationRequest) {
  const notifications = [];

  for (const userId of request.userIds) {
    const notification = await prisma.notification.create({
      data: {
        type: request.type,
        title: request.title,
        message: request.message,
        data: request.data,
        userId,
        fromUserId: request.fromUserId,
        projectId: request.projectId,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform to match our interface
    notifications.push({
      id: notification.id,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      userId: notification.userId,
      fromUserId: notification.fromUserId,
      projectId: notification.projectId,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      fromUser: notification.fromUser,
      project: notification.project ? {
        id: notification.project.id,
        name: notification.project.name,
        color: undefined,
      } : undefined,
    });
  }

  // TODO: Send real-time updates to connected clients
  // TODO: Send email/push notifications based on user preferences

  return notifications;
}

async function getUnreadCount(userId: string, projectId?: string): Promise<number> {
  const where: any = {
    userId,
    isRead: false,
  };

  if (projectId) {
    where.projectId = projectId;
  }

  return await prisma.notification.count({
    where,
  });
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
      const projectId = searchParams.get('projectId') || undefined;
      const unreadCount = await getUnreadCount(authResult.userId, projectId);
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
      unreadCount,
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

    // Validate that all user IDs exist
    const users = await prisma.user.findMany({
      where: {
        id: { in: body.userIds },
      },
      select: { id: true },
    });

    if (users.length !== body.userIds.length) {
      return NextResponse.json(
        { error: 'One or more user IDs are invalid' },
        { status: 400 }
      );
    }

    // If projectId is specified, verify user has permission to send notifications in that project
    if (body.projectId) {
      const membership = await prisma.membership.findFirst({
        where: {
          projectId: body.projectId,
          userId: authResult.userId,
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'You do not have access to this project' },
          { status: 403 }
        );
      }
    }

    const notifications = await createNotifications(body);

    return NextResponse.json(notifications, { status: 201 });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}