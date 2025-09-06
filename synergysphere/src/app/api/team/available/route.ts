import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/team/available - Get all users available for project assignment
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
    const projectId = searchParams.get('excludeProject'); // Optionally exclude members of a specific project

    let whereCondition: any = {};
    
    // If excluding a project, get users not already in that project
    if (projectId) {
      whereCondition = {
        NOT: {
          memberships: {
            some: {
              projectId: projectId
            }
          }
        }
      };
    }

    // Get ALL users in the system for team/project management
    // If you can create new users, you should be able to see existing ones too
    const availableUsers = await prisma.user.findMany({
      where: {
        ...whereCondition,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Remove duplicates and format response
    const uniqueUsers = availableUsers.reduce((acc, user) => {
      if (!acc.find(u => u.id === user.id)) {
        acc.push({
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          joinedAt: user.createdAt.toISOString(),
        });
      }
      return acc;
    }, [] as any[]);

    return NextResponse.json({ users: uniqueUsers });
  } catch (error) {
    console.error('Failed to fetch available users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}