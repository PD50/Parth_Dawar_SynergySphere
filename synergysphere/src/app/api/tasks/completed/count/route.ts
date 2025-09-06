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

    // Count completed tasks in projects where user is a member
    const count = await prisma.task.count({
      where: {
        status: 'COMPLETED',
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
    console.error('Failed to get completed task count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}