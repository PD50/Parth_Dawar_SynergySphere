import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Task title too long'),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");

    // Check if user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        memberships: {
          some: {
            userId: authResult.userId,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const whereClause: any = {
      projectId,
    };

    if (status) {
      whereClause.status = status;
    }

    if (assigneeId) {
      whereClause.assigneeId = assigneeId;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
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

    return NextResponse.json({ tasks: transformedTasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await req.json();
    const validatedData = createTaskSchema.parse(body);

    // Check if user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        memberships: {
          some: {
            userId: authResult.userId,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // If assigneeId is provided, verify they are a member of the project
    if (validatedData.assigneeId) {
      const assigneeMember = await prisma.membership.findFirst({
        where: {
          projectId,
          userId: validatedData.assigneeId,
        },
      });

      if (!assigneeMember) {
        return NextResponse.json(
          { error: "Assignee is not a member of this project" },
          { status: 400 }
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status,
        priority: validatedData.priority,
        assigneeId: validatedData.assigneeId,
        dueDate: validatedData.dueDate,
        projectId,
        creatorId: authResult.userId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform task to ensure consistent status and priority values
    const transformedTask = {
      ...task,
      status: task.status.toUpperCase() as 'TODO' | 'IN_PROGRESS' | 'DONE',
      priority: task.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    };

    return NextResponse.json({ task: transformedTask }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}