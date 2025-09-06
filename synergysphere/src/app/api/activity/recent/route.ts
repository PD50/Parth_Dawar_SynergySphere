import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const limit = parseInt(searchParams.get('limit') || '10');

    // For now, return a simple activity feed based on recent messages and tasks
    // In a full implementation, you'd have a dedicated activity/audit log table
    
    const recentMessages = await prisma.message.findMany({
      where: {
        project: {
          memberships: {
            some: {
              userId: authResult.userId,
            },
          },
        },
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 5),
    });

    const recentTasks = await prisma.task.findMany({
      where: {
        project: {
          memberships: {
            some: {
              userId: authResult.userId,
            },
          },
        },
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        assignee: {
          select: {
            name: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: Math.min(limit, 5),
    });

    // Combine and format activities
    const activities = [
      ...recentMessages.map(msg => ({
        id: `message-${msg.id}`,
        type: 'project' as const,
        message: `${msg.author.name} posted a message in ${msg.project.name}`,
        timestamp: msg.createdAt,
      })),
      ...recentTasks.map(task => ({
        id: `task-${task.id}`,
        type: 'task' as const,
        message: `${task.assignee?.name || 'Someone'} updated "${task.title}" in ${task.project.name}`,
        timestamp: task.updatedAt,
      }))
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Failed to get recent activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}