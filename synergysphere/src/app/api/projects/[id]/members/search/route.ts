import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const projectId = params.id;
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Verify user has access to the project
    const membership = await prisma.membership.findFirst({
      where: {
        projectId,
        userId: authResult.userId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }

    // Search for project members
    const whereCondition: any = {
      projectId,
    };

    if (query.trim()) {
      whereCondition.user = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      };
    }

    const members = await prisma.membership.findMany({
      where: whereCondition,
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
      orderBy: {
        user: {
          name: 'asc',
        },
      },
      take: limit,
    });

    // Transform the response
    const searchResults = members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      avatarUrl: member.user.avatarUrl,
      role: member.role,
      isOnline: false, // TODO: Implement online status tracking
    }));

    return NextResponse.json({ members: searchResults });
  } catch (error) {
    console.error('Failed to search project members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}