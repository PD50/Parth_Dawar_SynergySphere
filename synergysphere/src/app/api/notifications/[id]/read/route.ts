import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@/types/notifications';

async function markNotificationAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId, // Ensure the notification belongs to the requesting user
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

  if (!notification) {
    return null;
  }

  // Mark as read if not already read
  if (!notification.isRead) {
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
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
    return {
      id: updatedNotification.id,
      type: updatedNotification.type as NotificationType,
      title: updatedNotification.title,
      message: updatedNotification.message,
      data: updatedNotification.data,
      userId: updatedNotification.userId,
      fromUserId: updatedNotification.fromUserId,
      projectId: updatedNotification.projectId,
      isRead: updatedNotification.isRead,
      readAt: updatedNotification.readAt,
      createdAt: updatedNotification.createdAt,
      fromUser: updatedNotification.fromUser,
      project: updatedNotification.project ? {
        id: updatedNotification.project.id,
        name: updatedNotification.project.name,
        color: undefined,
      } : undefined,
    };
  }

  // Already read, return as is
  return {
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
  };
}

async function markNotificationAsUnread(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId, // Ensure the notification belongs to the requesting user
    },
  });

  if (!notification) {
    return null;
  }

  // Mark as unread if currently read
  if (notification.isRead) {
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: false,
        readAt: null,
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
    return {
      id: updatedNotification.id,
      type: updatedNotification.type as NotificationType,
      title: updatedNotification.title,
      message: updatedNotification.message,
      data: updatedNotification.data,
      userId: updatedNotification.userId,
      fromUserId: updatedNotification.fromUserId,
      projectId: updatedNotification.projectId,
      isRead: updatedNotification.isRead,
      readAt: updatedNotification.readAt,
      createdAt: updatedNotification.createdAt,
      fromUser: updatedNotification.fromUser,
      project: updatedNotification.project ? {
        id: updatedNotification.project.id,
        name: updatedNotification.project.name,
        color: undefined,
      } : undefined,
    };
  }

  // Already unread, return as is
  return {
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
  };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const notificationId = params.id;
    const body = await req.json().catch(() => ({}));

    // Default to marking as read, but allow marking as unread
    const isRead = body.isRead !== undefined ? body.isRead : true;

    let updatedNotification;
    if (isRead) {
      updatedNotification = await markNotificationAsRead(notificationId, authResult.userId);
    } else {
      updatedNotification = await markNotificationAsUnread(notificationId, authResult.userId);
    }

    if (!updatedNotification) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Failed to update notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}