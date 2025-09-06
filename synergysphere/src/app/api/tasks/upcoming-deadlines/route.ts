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

    // Get next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Count tasks with due dates in the next 7 days
    const count = await prisma.task.count({
      where: {
        dueDate: {
          gte: new Date(),
          lte: nextWeek,
        },
        status: {
          not: 'COMPLETED',
        },
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
    console.error('Failed to get upcoming deadlines count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}