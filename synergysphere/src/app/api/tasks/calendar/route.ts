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
    const month = searchParams.get("month"); // Format: YYYY-MM
    const year = searchParams.get("year");   // Format: YYYY

    // Default to current month/year if not provided
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (month) {
      // Parse month format YYYY-MM
      const [yearStr, monthStr] = month.split('-');
      const targetYear = parseInt(yearStr);
      const targetMonth = parseInt(monthStr) - 1; // JavaScript months are 0-indexed
      
      startDate = new Date(targetYear, targetMonth, 1);
      endDate = new Date(targetYear, targetMonth + 1, 0); // Last day of month
    } else if (year) {
      // Get full year
      const targetYear = parseInt(year);
      startDate = new Date(targetYear, 0, 1); // Jan 1
      endDate = new Date(targetYear, 11, 31); // Dec 31
    } else {
      // Default to current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Fetch tasks with due dates in the specified range for projects where user is a member
    const tasks = await prisma.task.findMany({
      where: {
        project: {
          memberships: {
            some: {
              userId: authResult.userId,
            },
          },
        },
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
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
        { dueDate: "asc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Transform tasks to ensure consistent status and priority values
    const transformedTasks = tasks.map(task => ({
      ...task,
      status: task.status.toUpperCase() as 'TODO' | 'IN_PROGRESS' | 'DONE',
      priority: task.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    }));

    // Group tasks by date (YYYY-MM-DD format)
    const tasksByDate: Record<string, typeof transformedTasks> = {};
    
    transformedTasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = task.dueDate.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!tasksByDate[dateKey]) {
          tasksByDate[dateKey] = [];
        }
        tasksByDate[dateKey].push(task);
      }
    });

    // Calculate calendar statistics
    const now_start = new Date();
    now_start.setHours(0, 0, 0, 0);

    const stats = {
      totalTasks: transformedTasks.length,
      overdueTasks: transformedTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < now_start && task.status !== 'DONE'
      ).length,
      todayTasks: transformedTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        const today = new Date();
        return taskDate.toDateString() === today.toDateString();
      }).length,
      upcomingTasks: transformedTasks.filter(task => {
        if (!task.dueDate || task.status === 'DONE') return false;
        const taskDate = new Date(task.dueDate);
        const today = new Date();
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return taskDate > today && taskDate <= sevenDaysFromNow;
      }).length,
      completedTasks: transformedTasks.filter(task => task.status === 'DONE').length,
      tasksByStatus: {
        TODO: transformedTasks.filter(task => task.status === 'TODO').length,
        IN_PROGRESS: transformedTasks.filter(task => task.status === 'IN_PROGRESS').length,
        DONE: transformedTasks.filter(task => task.status === 'DONE').length,
      },
      tasksByPriority: {
        LOW: transformedTasks.filter(task => task.priority === 'LOW').length,
        MEDIUM: transformedTasks.filter(task => task.priority === 'MEDIUM').length,
        HIGH: transformedTasks.filter(task => task.priority === 'HIGH').length,
        URGENT: transformedTasks.filter(task => task.priority === 'URGENT').length,
      },
    };

    // Generate calendar events format for easier frontend consumption
    const calendarEvents = transformedTasks.map(task => ({
      id: task.id,
      title: task.title,
      date: task.dueDate?.toISOString().split('T')[0],
      status: task.status,
      priority: task.priority,
      project: task.project,
      assignee: task.assignee,
      description: task.description,
      isOverdue: task.dueDate && new Date(task.dueDate) < now_start && task.status !== 'DONE',
    }));

    return NextResponse.json({
      tasks: transformedTasks,
      tasksByDate,
      calendarEvents,
      stats,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Get calendar tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar tasks" },
      { status: 500 }
    );
  }
}