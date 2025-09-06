import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { projectId } = body;

    // Build where condition
    const whereCondition: any = {
      userId: authResult.userId,
      isRead: false, // Only mark unread notifications as read
    };

    if (projectId) {
      whereCondition.projectId = projectId;
    }

    // Update notifications to mark them as read
    const updateResult = await prisma.notification.updateMany({
      where: whereCondition,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Get updated unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: authResult.userId,
        isRead: false,
        ...(projectId ? { projectId } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: updateResult.count,
      unreadCount,
    });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}