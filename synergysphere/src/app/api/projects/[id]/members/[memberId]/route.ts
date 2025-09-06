import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/projects/[id]/members/[memberId] - Remove member from project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { id: projectId, memberId } = await params;

    // Verify user has admin/owner permissions for this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: authResult.userId },
          {
            memberships: {
              some: {
                userId: authResult.userId,
                role: {
                  in: ['OWNER', 'ADMIN']
                }
              }
            }
          }
        ]
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or no permission to remove members' },
        { status: 404 }
      );
    }

    // Check if membership exists
    const membership = await prisma.membership.findFirst({
      where: {
        projectId,
        userId: memberId,
      },
      include: {
        user: {
          select: {
            name: true,
          }
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Member not found in this project' },
        { status: 404 }
      );
    }

    // Prevent removing the project owner
    if (membership.role === 'OWNER' || project.ownerId === memberId) {
      return NextResponse.json(
        { error: 'Cannot remove the project owner' },
        { status: 400 }
      );
    }

    // Remove membership
    await prisma.membership.delete({
      where: {
        id: membership.id,
      },
    });

    return NextResponse.json({ 
      message: `${membership.user.name} has been removed from the project` 
    });
  } catch (error) {
    console.error('Failed to remove member from project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}