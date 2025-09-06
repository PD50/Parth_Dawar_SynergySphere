import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
  projectId: z.string().optional(), // Optional: invite to specific project
});

// POST /api/team/invite - Send team invitation
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
    const inviteData = inviteSchema.parse(body);

    // Check if current user has permission to invite
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
        { error: 'Not authorized to send invitations' },
        { status: 403 }
      );
    }

    // Check if user already exists
    let existingUser = await prisma.user.findUnique({
      where: { email: inviteData.email },
    });

    if (existingUser) {
      // If inviting to a specific project, add them as a member
      if (inviteData.projectId) {
        // Check if user is already a member of this project
        const existingMembership = await prisma.membership.findFirst({
          where: {
            projectId: inviteData.projectId,
            userId: existingUser.id,
          }
        });

        if (existingMembership) {
          return NextResponse.json(
            { error: 'User is already a member of this project' },
            { status: 400 }
          );
        }

        // Verify current user owns or admins the project
        const project = await prisma.project.findFirst({
          where: {
            id: inviteData.projectId,
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
            { error: 'Project not found or no permission to invite to this project' },
            { status: 404 }
          );
        }

        // Add user to project
        await prisma.membership.create({
          data: {
            projectId: inviteData.projectId,
            userId: existingUser.id,
            role: inviteData.role,
          }
        });

        return NextResponse.json({
          message: 'User added to project successfully',
          user: {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
          }
        });
      }

      return NextResponse.json(
        { error: 'User with this email already exists. Use project-specific invitation instead.' },
        { status: 400 }
      );
    }

    // Create new user with a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Extract name from email (simple approach)
    const nameFromEmail = inviteData.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim();
    const capitalizedName = nameFromEmail.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ') || 'New User';

    const newUser = await prisma.user.create({
      data: {
        name: capitalizedName,
        email: inviteData.email,
        passwordHash: hashedPassword,
      },
    });

    // If inviting to a specific project, add them as a member
    if (inviteData.projectId) {
      // Verify current user owns or admins the project
      const project = await prisma.project.findFirst({
        where: {
          id: inviteData.projectId,
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
        // Remove the created user if we can't add them to the project
        await prisma.user.delete({ where: { id: newUser.id } });
        return NextResponse.json(
          { error: 'Project not found or no permission to invite to this project' },
          { status: 404 }
        );
      }

      // Add user to project
      await prisma.membership.create({
        data: {
          projectId: inviteData.projectId,
          userId: newUser.id,
          role: inviteData.role,
        }
      });
    }

    // In a real application, you would send an email with the temporary password
    // For demo purposes, we return it in the response
    return NextResponse.json({
      message: 'Invitation sent successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      // In production, remove this and send via email
      tempCredentials: {
        email: newUser.email,
        tempPassword: tempPassword,
        loginUrl: `${req.nextUrl.origin}/auth/login`,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to send invitation:', error);
    
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