import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

// GET /api/team/members - Get all users that are part of projects the current user owns/admins
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Get ALL users in the system for team management
    // This makes sense because if you can invite new users, you should see all existing users too
    const allUsers = await prisma.user.findMany({
      include: {
        memberships: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });

    const allMembers = allUsers;

    // Transform members for frontend
    const transformedMembers = allMembers.map(member => {
      // Determine the highest role across all projects
      const roles = member.memberships.map(m => m.role);
      let globalRole = 'MEMBER';
      if (roles.includes('OWNER')) {
        globalRole = 'OWNER';
      } else if (roles.includes('ADMIN')) {
        globalRole = 'ADMIN';
      }

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        avatarUrl: member.avatarUrl,
        role: globalRole,
        joinedAt: member.createdAt.toISOString(),
        lastActive: member.updatedAt.toISOString(), // Using updatedAt as lastActive for now
        projectCount: member.memberships.length,
        projects: member.memberships.map(m => ({
          id: m.project.id,
          name: m.project.name,
          role: m.role,
        })),
      };
    });

    return NextResponse.json({ members: transformedMembers });
  } catch (error) {
    console.error('Failed to fetch team members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/team/members - Create/invite new user (delegates to invitation system)
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
    const userData = inviteUserSchema.parse(body);

    // Use the more robust invitation system
    const inviteResponse = await fetch(`${req.nextUrl.origin}/api/team/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || '', // Forward auth cookies
      },
      body: JSON.stringify({
        email: userData.email,
        role: userData.role,
      }),
    });

    const inviteResult = await inviteResponse.json();

    if (!inviteResponse.ok) {
      return NextResponse.json(inviteResult, { status: inviteResponse.status });
    }

    // Transform the response to match the expected format
    const userResponse = {
      id: inviteResult.user.id,
      name: inviteResult.user.name,
      email: inviteResult.user.email,
      avatarUrl: null,
      role: userData.role,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      projectCount: 0,
      projects: [],
      // Include credentials for demo purposes (in production, these would be sent via email)
      tempCredentials: inviteResult.tempCredentials,
      message: inviteResult.message,
    };

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    
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