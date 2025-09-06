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

    // Count total unique team members across all projects where user is a member
    const count = await prisma.membership.count({
      where: {
        project: {
          memberships: {
            some: {
              userId: authResult.userId,
            },
          },
        },
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Failed to get member count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}