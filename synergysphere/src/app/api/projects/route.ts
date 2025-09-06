import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().optional(),
  color: z.string().optional(),
});

// GET /api/projects - List user's projects
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
    const cursor = searchParams.get('cursor');

    // Build cursor condition
    const cursorCondition = cursor ? { id: { lt: cursor } } : undefined;

    // Get projects where user is a member
    const projects = await prisma.project.findMany({
      where: {
        memberships: {
          some: {
            userId: authResult.userId,
          },
        },
      },
      include: {
        memberships: {
          select: {
            id: true,
            role: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            memberships: true,
            tasks: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit + 1,
      ...(cursorCondition && { cursor: cursorCondition, skip: 1 }),
    });

    // Check if there are more projects
    const hasMore = projects.length > limit;
    const projectsToReturn = hasMore ? projects.slice(0, -1) : projects;
    const nextCursor = hasMore ? projectsToReturn[projectsToReturn.length - 1].id : null;

    // Transform projects for frontend
    const transformedProjects = projectsToReturn.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      memberCount: project._count.memberships,
      taskCount: project._count.tasks,
      completedTaskCount: project.tasks.filter(task => task.status === 'COMPLETED').length,
      userRole: project.memberships[0]?.role, // User's role in this project
    }));

    return NextResponse.json({
      projects: transformedProjects,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const body = await req.json();
    const projectData = createProjectSchema.parse(body);

    // Create project with user as owner
    const project = await prisma.project.create({
      data: {
        name: projectData.name,
        description: projectData.description,
        color: projectData.color || '#3b82f6',
        status: 'ACTIVE',
        ownerId: authResult.userId,
        memberships: {
          create: {
            userId: authResult.userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        memberships: {
          select: {
            id: true,
            role: true,
          },
        },
        _count: {
          select: {
            memberships: true,
            tasks: true,
          },
        },
      },
    });

    // Transform project for response
    const transformedProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      memberCount: project._count.memberships,
      taskCount: project._count.tasks,
      completedTaskCount: 0,
      userRole: project.memberships[0]?.role,
    };

    return NextResponse.json(transformedProject, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}