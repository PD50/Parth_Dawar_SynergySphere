import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Notification } from '@/types/notifications';

// Mock database - replace with actual database implementation
const mockNotifications: Notification[] = []; // This should be the same array as in the main notifications route

async function markNotificationAsRead(notificationId: string, userId: string): Promise<Notification | null> {
  const notificationIndex = mockNotifications.findIndex(notification => notification.id === notificationId);
  if (notificationIndex === -1) return null;

  const notification = mockNotifications[notificationIndex];
  
  // Verify that the notification belongs to the requesting user
  if (notification.userId !== userId) {
    throw new Error('Unauthorized: Cannot mark another user\'s notification as read');
  }

  // Mark as read if not already read
  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    mockNotifications[notificationIndex] = notification;

    // TODO: Emit real-time update to update unread count
    // TODO: Update any cached unread counts
  }

  return notification;
}

async function markNotificationAsUnread(notificationId: string, userId: string): Promise<Notification | null> {
  const notificationIndex = mockNotifications.findIndex(notification => notification.id === notificationId);
  if (notificationIndex === -1) return null;

  const notification = mockNotifications[notificationIndex];
  
  // Verify that the notification belongs to the requesting user
  if (notification.userId !== userId) {
    throw new Error('Unauthorized: Cannot mark another user\'s notification as unread');
  }

  // Mark as unread if currently read
  if (notification.isRead) {
    notification.isRead = false;
    notification.readAt = undefined;
    mockNotifications[notificationIndex] = notification;

    // TODO: Emit real-time update to update unread count
    // TODO: Update any cached unread counts
  }

  return notification;
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
    const body = await req.json();

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
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Failed to update notification:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}