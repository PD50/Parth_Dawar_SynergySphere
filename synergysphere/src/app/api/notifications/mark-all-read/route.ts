import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Notification } from '@/types/notifications';

// Mock database - replace with actual database implementation
const mockNotifications: Notification[] = []; // This should be the same array as in the main notifications route

async function markAllNotificationsAsRead(userId: string, projectId?: string): Promise<{
  updatedCount: number;
  notifications: Notification[];
}> {
  let updatedCount = 0;
  const updatedNotifications: Notification[] = [];

  for (let i = 0; i < mockNotifications.length; i++) {
    const notification = mockNotifications[i];
    
    // Only update notifications for the requesting user
    if (notification.userId !== userId) continue;
    
    // If projectId is specified, only update notifications for that project
    if (projectId && notification.projectId !== projectId) continue;
    
    // Only update if not already read
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      mockNotifications[i] = notification;
      updatedCount++;
      updatedNotifications.push(notification);
    }
  }

  // TODO: Emit real-time update to update unread count
  // TODO: Update any cached unread counts
  // TODO: Log the bulk read action for analytics

  return {
    updatedCount,
    notifications: updatedNotifications
  };
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

    const body = await req.json().catch(() => ({}));
    
    // Optional: allow filtering by project
    const projectId = body.projectId;

    // Validate projectId if provided
    if (projectId && typeof projectId !== 'string') {
      return NextResponse.json(
        { error: 'projectId must be a string' },
        { status: 400 }
      );
    }

    // TODO: If projectId is provided, verify user has access to that project

    const result = await markAllNotificationsAsRead(authResult.userId, projectId);

    return NextResponse.json({
      success: true,
      updatedCount: result.updatedCount,
      message: projectId 
        ? `Marked ${result.updatedCount} notifications as read for project ${projectId}`
        : `Marked ${result.updatedCount} notifications as read`
    });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}