import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getMessageThread(rootMessageId: string) {
  // Find the root message
  const rootMessage = await prisma.message.findUnique({
    where: { id: rootMessageId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
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
      _count: {
        select: {
          replies: true,
        },
      },
    },
  });

  if (!rootMessage || rootMessage.deletedAt) {
    return null;
  }

  // If this message is actually a reply, find the real root
  const actualRootId = rootMessage.threadId || rootMessageId;
  
  let actualRootMessage = rootMessage;
  if (actualRootId !== rootMessageId) {
    const fetchedRoot = await prisma.message.findUnique({
      where: { id: actualRootId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
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
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });
    
    if (fetchedRoot && !fetchedRoot.deletedAt) {
      actualRootMessage = fetchedRoot;
    }
  }

  // Find all replies in this thread
  const replies = await prisma.message.findMany({
    where: {
      threadId: actualRootId,
      NOT: { id: actualRootId },
      deletedAt: null,
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
      _count: {
        select: {
          replies: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Get unique participants in the thread
  const participantIds = new Set([
    actualRootMessage.authorId,
    ...replies.map(reply => reply.authorId),
  ]);

  const participants = await prisma.user.findMany({
    where: {
      id: { in: Array.from(participantIds) },
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  });

  const lastReplyAt = replies.length > 0 
    ? replies[replies.length - 1].createdAt 
    : actualRootMessage.createdAt;

  // Transform messages to match our interface
  const transformMessage = (message: any) => ({
    id: message.id,
    content: message.content,
    authorId: message.authorId,
    projectId: message.projectId,
    parentId: message.parentId,
    threadId: message.threadId,
    mentions: message.mentions,
    attachments: message.attachments,
    reactions: message.reactions.map((reaction: any) => ({
      id: reaction.id,
      emoji: reaction.emoji,
      userId: reaction.userId,
      userName: reaction.user.name,
      createdAt: reaction.createdAt,
    })),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    editedAt: message.editedAt,
    deletedAt: message.deletedAt,
    author: message.author,
    replies: [],
    mentionedUsers: [],
    isEdited: message.isEdited,
    replyCount: message._count.replies,
  });

  return {
    id: actualRootId,
    rootMessage: transformMessage(actualRootMessage),
    replies: replies.map(transformMessage),
    totalReplies: replies.length,
    lastReplyAt: new Date(lastReplyAt),
    participants,
  };
}

async function getThreadReplies(
  rootMessageId: string, 
  limit: number = 50, 
  cursor?: string
) {
  // Find the actual root message ID
  const rootMessage = await prisma.message.findUnique({
    where: { id: rootMessageId },
    select: { threadId: true },
  });

  if (!rootMessage) {
    return { replies: [], hasMore: false, nextCursor: undefined };
  }

  const actualRootId = rootMessage.threadId || rootMessageId;

  // Cursor-based pagination
  const cursorCondition = cursor ? { id: cursor } : undefined;

  const replies = await prisma.message.findMany({
    where: {
      threadId: actualRootId,
      NOT: { id: actualRootId },
      deletedAt: null,
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
      _count: {
        select: {
          replies: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: limit + 1, // Take one extra to check if there are more
    cursor: cursorCondition,
    skip: cursor ? 1 : 0, // Skip the cursor item
  });

  const hasMore = replies.length > limit;
  const items = hasMore ? replies.slice(0, limit) : replies;

  // Transform to match our interface
  const transformedReplies = items.map((message: any) => ({
    id: message.id,
    content: message.content,
    authorId: message.authorId,
    projectId: message.projectId,
    parentId: message.parentId,
    threadId: message.threadId,
    mentions: message.mentions,
    attachments: message.attachments,
    reactions: message.reactions.map((reaction: any) => ({
      id: reaction.id,
      emoji: reaction.emoji,
      userId: reaction.userId,
      userName: reaction.user.name,
      createdAt: reaction.createdAt,
    })),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    editedAt: message.editedAt,
    deletedAt: message.deletedAt,
    author: message.author,
    replies: [],
    mentionedUsers: [],
    isEdited: message.isEdited,
    replyCount: message._count.replies,
  }));

  return {
    replies: transformedReplies,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1].id : undefined,
  };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const messageId = params.id;
    const searchParams = req.nextUrl.searchParams;
    
    // Check if we want full thread or just replies
    const includeRoot = searchParams.get('includeRoot') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor') || undefined;

    // First, verify the message exists and get its project ID
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { projectId: true, deletedAt: true },
    });

    if (!message || message.deletedAt) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify user has access to the project this thread belongs to
    const membership = await prisma.membership.findFirst({
      where: {
        projectId: message.projectId,
        userId: authResult.userId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this thread' },
        { status: 403 }
      );
    }

    if (includeRoot) {
      // Return full thread with root message and replies
      const thread = await getMessageThread(messageId);
      
      if (!thread) {
        return NextResponse.json(
          { error: 'Thread not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(thread);
    } else {
      // Return only replies with pagination
      const result = await getThreadReplies(messageId, limit, cursor);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Failed to fetch message thread:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}