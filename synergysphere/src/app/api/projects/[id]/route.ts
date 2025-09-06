import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;

    // Get project with all related data
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        memberships: {
          some: {
            userId: authResult.userId,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            title: true,
            updatedAt: true,
            assignee: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 10,
        },
        messages: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            memberships: true,
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Calculate progress
    const completedTasks = project.tasks.filter(task => task.status === 'COMPLETED').length;
    const totalTasks = project.tasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Transform members
    const members = project.memberships.map(membership => ({
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      avatarUrl: membership.user.avatarUrl || '',
      role: membership.role,
    }));

    // Create recent activity from tasks and messages
    const recentActivity = [
      ...project.tasks
        .filter(task => task.status === 'COMPLETED')
        .slice(0, 5)
        .map(task => ({
          id: `task-${task.id}`,
          type: 'task_completed' as const,
          message: `Completed task: ${task.title}`,
          user: {
            name: task.assignee?.name || 'Unknown',
            avatarUrl: task.assignee?.avatarUrl || '',
          },
          timestamp: task.updatedAt.toISOString(),
        })),
      ...project.messages.slice(0, 5).map(message => ({
        id: `message-${message.id}`,
        type: 'comment_added' as const,
        message: `Added comment: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
        user: {
          name: message.author.name,
          avatarUrl: message.author.avatarUrl || '',
        },
        timestamp: message.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Transform project data
    const transformedProject = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description || '',
        status: project.status,
        color: project.color || '#3b82f6',
        progress,
        totalTasks,
        completedTasks,
        totalMembers: project._count.memberships,
        deadline: null, // Add deadline field to schema if needed
        createdAt: project.createdAt.toISOString(),
      },
      members,
      recentActivity,
    };

    return NextResponse.json(transformedProject);
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}