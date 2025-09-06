import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToMe = searchParams.get("assignedToMe");
    const createdByMe = searchParams.get("createdByMe");

    // Build where clause for filtering tasks
    const whereClause: any = {
      project: {
        memberships: {
          some: {
            userId: authResult.userId,
          },
        },
      },
    };

    // Apply filters based on query parameters
    if (status) {
      whereClause.status = status.toUpperCase();
    }

    if (priority) {
      whereClause.priority = priority.toUpperCase();
    }

    if (assignedToMe === 'true') {
      whereClause.assigneeId = authResult.userId;
    }

    if (createdByMe === 'true') {
      whereClause.creatorId = authResult.userId;
    }

    // Fetch all tasks for projects where the user is a member
    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        creator: {
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
            color: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Transform tasks to ensure consistent status and priority values
    const transformedTasks = tasks.map(task => ({
      ...task,
      status: task.status.toUpperCase() as 'TODO' | 'IN_PROGRESS' | 'DONE',
      priority: task.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    }));

    // Group tasks by status for easier dashboard consumption
    const tasksByStatus = {
      TODO: transformedTasks.filter(task => task.status === 'TODO'),
      IN_PROGRESS: transformedTasks.filter(task => task.status === 'IN_PROGRESS'),
      DONE: transformedTasks.filter(task => task.status === 'DONE'),
    };

    // Calculate summary statistics
    const summary = {
      total: transformedTasks.length,
      todo: tasksByStatus.TODO.length,
      inProgress: tasksByStatus.IN_PROGRESS.length,
      done: tasksByStatus.DONE.length,
      overdue: transformedTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
      ).length,
      dueSoon: transformedTasks.filter(task => 
        task.dueDate && 
        new Date(task.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
        new Date(task.dueDate) >= new Date() &&
        task.status !== 'DONE'
      ).length,
    };

    return NextResponse.json({
      tasks: transformedTasks,
      tasksByStatus,
      summary,
    });
  } catch (error) {
    console.error("Get all tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}