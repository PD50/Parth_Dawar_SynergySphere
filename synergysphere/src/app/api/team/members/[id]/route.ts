import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
  name: z.string().min(1).optional(),
});

// GET /api/team/members/[id] - Get specific member details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { id: memberId } = await params;

    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        memberships: {
          some: {
            project: {
              memberships: {
                some: {
                  userId: authResult.userId,
                  role: {
                    in: ['OWNER', 'ADMIN']
                  }
                }
              }
            }
          }
        }
      },
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
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Determine the highest role across all projects
    const roles = member.memberships.map(m => m.role);
    let globalRole = 'MEMBER';
    if (roles.includes('OWNER')) {
      globalRole = 'OWNER';
    } else if (roles.includes('ADMIN')) {
      globalRole = 'ADMIN';
    }

    const memberResponse = {
      id: member.id,
      name: member.name,
      email: member.email,
      avatarUrl: member.avatarUrl,
      role: globalRole,
      joinedAt: member.createdAt.toISOString(),
      lastActive: member.updatedAt.toISOString(),
      projectCount: member.memberships.length,
      projects: member.memberships.map(m => ({
        id: m.project.id,
        name: m.project.name,
        role: m.role,
      })),
    };

    return NextResponse.json(memberResponse);
  } catch (error) {
    console.error('Failed to fetch member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/team/members/[id] - Update member details (limited functionality)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { id: memberId } = await params;

    // Check if current user has admin/owner permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: authResult.userId },
      include: {
        ownedProjects: true,
        memberships: {
          where: {
            role: {
              in: ['OWNER', 'ADMIN']
            }
          }
        }
      }
    });

    if (!currentUser || (currentUser.ownedProjects.length === 0 && currentUser.memberships.length === 0)) {
      return NextResponse.json(
        { error: 'Not authorized to update team members' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData = updateMemberSchema.parse(body);

    // For now, we can only update basic user info, not project-specific roles
    // Project-specific role updates should be handled via project member APIs
    const updatedUser = await prisma.user.update({
      where: { id: memberId },
      data: {
        ...(updateData.name && { name: updateData.name }),
      },
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
    });

    // Determine the highest role across all projects
    const roles = updatedUser.memberships.map(m => m.role);
    let globalRole = 'MEMBER';
    if (roles.includes('OWNER')) {
      globalRole = 'OWNER';
    } else if (roles.includes('ADMIN')) {
      globalRole = 'ADMIN';
    }

    const memberResponse = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatarUrl,
      role: globalRole,
      joinedAt: updatedUser.createdAt.toISOString(),
      lastActive: updatedUser.updatedAt.toISOString(),
      projectCount: updatedUser.memberships.length,
      projects: updatedUser.memberships.map(m => ({
        id: m.project.id,
        name: m.project.name,
        role: m.role,
      })),
    };

    return NextResponse.json(memberResponse);
  } catch (error) {
    console.error('Failed to update member:', error);
    
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

// DELETE /api/team/members/[id] - Remove member from all projects (owner only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { id: memberId } = await params;

    // Only owners can delete users completely
    const currentUser = await prisma.user.findUnique({
      where: { id: authResult.userId },
      include: {
        ownedProjects: true,
      }
    });

    if (!currentUser || currentUser.ownedProjects.length === 0) {
      return NextResponse.json(
        { error: 'Only project owners can remove team members' },
        { status: 403 }
      );
    }

    // Check if the member is in any of the current user's projects
    const memberInProjects = await prisma.membership.findMany({
      where: {
        userId: memberId,
        project: {
          ownerId: authResult.userId
        }
      }
    });

    if (memberInProjects.length === 0) {
      return NextResponse.json(
        { error: 'Member not found in your projects' },
        { status: 404 }
      );
    }

    // Remove member from all projects owned by current user
    await prisma.membership.deleteMany({
      where: {
        userId: memberId,
        project: {
          ownerId: authResult.userId
        }
      }
    });

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Failed to remove member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}