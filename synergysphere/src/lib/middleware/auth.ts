import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authService } from '../auth';

const prisma = new PrismaClient();

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface Membership {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  joinedAt: Date;
}

export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: User) => Promise<Response>
): Promise<Response> {
  try {
    const token = req.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = authService.verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    return handler(req, user);
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

// Project membership check
export async function withProjectAccess(
  req: NextRequest,
  projectId: string,
  user: User,
  handler: (req: NextRequest, user: User, membership: Membership) => Promise<Response>
): Promise<Response> {
  try {
    const membership = await prisma.membership.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return handler(req, user, membership);
  } catch (error) {
    console.error('Project access error:', error);
    return NextResponse.json({ error: 'Access check failed' }, { status: 500 });
  }
}