import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/search - Search users for mentions, team assignment, etc.
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
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const projectId = searchParams.get('projectId'); // Optional: filter by project members

    let whereCondition: any = {};

    // Build search condition
    if (query) {
      whereCondition.OR = [
        {
          name: {
            contains: query,
          },
        },
        {
          email: {
            contains: query,
          },
        },
      ];
    }

    // If projectId is provided, only search within project members
    if (projectId) {
      whereCondition.memberships = {
        some: {
          projectId: projectId,
        },
      };
    } else {
      // Otherwise, search users that the current user can access
      // This includes users from projects where current user is a member
      whereCondition.OR = [
        ...(whereCondition.OR || []),
        {
          memberships: {
            some: {
              project: {
                memberships: {
                  some: {
                    userId: authResult.userId,
                  },
                },
              },
            },
          },
        },
        // Include the current user in results
        {
          id: authResult.userId,
        },
      ];
    }

    // Search users
    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
      orderBy: [
        {
          name: 'asc',
        },
      ],
      take: limit,
    });

    // Remove duplicates and format response
    const uniqueUsers = users.reduce((acc, user) => {
      if (!acc.find(u => u.id === user.id)) {
        acc.push({
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        });
      }
      return acc;
    }, [] as any[]);

    return NextResponse.json({ 
      users: uniqueUsers,
      total: uniqueUsers.length,
    });

  } catch (error) {
    console.error('Failed to search users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}