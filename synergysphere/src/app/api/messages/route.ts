import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/messages - Get all messages from projects user has access to
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');
    const search = searchParams.get('search') || '';
    const projectId = searchParams.get('projectId');

    // Build cursor condition
    const cursorCondition = cursor ? { id: { lt: cursor } } : undefined;

    // Build where conditions - only get messages from projects user has access to
    const whereConditions: any = {
      project: {
        memberships: {
          some: {
            userId: authResult.userId,
          }
        }
      }
    };

    // Add project filter if specified
    if (projectId) {
      whereConditions.projectId = projectId;
    }

    // Add search filter if specified (SQLite case-insensitive search)
    if (search) {
      whereConditions.content = {
        contains: search,
      };
    }

    // Get messages with user access control
    const messages = await prisma.message.findMany({
      where: {
        ...whereConditions,
        ...(cursorCondition ? cursorCondition : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        replies: {
          select: {
            id: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1,
    });

    // Check if there are more messages
    const hasMore = messages.length > limit;
    const messagesToReturn = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? messagesToReturn[messagesToReturn.length - 1].id : null;

    // Transform messages for frontend
    const transformedMessages = messagesToReturn.map(message => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      author: message.author,
      project: message.project,
      parentMessageId: message.parentId,
      parentMessage: message.parent ? {
        id: message.parent.id,
        content: message.parent.content.substring(0, 100),
        author: message.parent.author,
      } : null,
      reactions: message.reactions.map(reaction => ({
        id: reaction.id,
        emoji: reaction.emoji,
        user: reaction.user,
        createdAt: reaction.createdAt.toISOString(),
      })),
      replyCount: message._count.replies,
      mentions: message.mentions || [],
    }));

    // Get user's accessible projects for filtering
    const userProjects = await prisma.project.findMany({
      where: {
        memberships: {
          some: {
            userId: authResult.userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        color: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      messages: transformedMessages,
      hasMore,
      nextCursor,
      projects: userProjects,
    });

  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}