import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MessageFilters } from '@/types/messages';

async function getProjectMessages(
  projectId: string,
  filters: MessageFilters = {},
  limit: number = 50,
  cursor?: string
) {
  const where: any = {
    projectId,
    deletedAt: null, // Only get non-deleted messages
  };

  // Apply filters
  if (filters.search) {
    where.content = {
      contains: filters.search,
      mode: 'insensitive',
    };
  }

  if (filters.authorId) {
    where.authorId = filters.authorId;
  }

  if (filters.onlyMentions) {
    where.mentions = {
      not: [],
    };
  }

  if (filters.dateFrom) {
    where.createdAt = {
      ...where.createdAt,
      gte: new Date(filters.dateFrom),
    };
  }

  if (filters.dateTo) {
    where.createdAt = {
      ...where.createdAt,
      lte: new Date(filters.dateTo),
    };
  }

  // Cursor-based pagination
  const cursorCondition = cursor ? { id: cursor } : undefined;

  const messages = await prisma.message.findMany({
    where,
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
      createdAt: 'desc',
    },
    take: limit + 1, // Take one extra to check if there are more
    cursor: cursorCondition,
    skip: cursor ? 1 : 0, // Skip the cursor item
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;

  // Transform to match our Message interface
  const transformedMessages = items.map((message: any) => ({
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
    mentionedUsers: [], // Will be populated if needed
    isEdited: message.isEdited,
    replyCount: message._count.replies,
  }));

  return {
    messages: transformedMessages,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1].id : undefined,
  };
}

async function createMessage(projectId: string, messageData: {
  content: string;
  parentId?: string;
  threadId?: string;
  mentions?: string[];
  attachments?: any[];
}, authorId: string) {
  // Extract mentions from content (simple implementation)
  const mentionRegex = /@(\w+)/g;
  const contentMentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(messageData.content)) !== null) {
    // Look up users by name
    const mentionedUsers = await prisma.user.findMany({
      where: {
        name: {
          contains: match[1],
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });
    
    mentionedUsers.forEach(user => {
      if (!contentMentions.includes(user.id)) {
        contentMentions.push(user.id);
      }
    });
  }

  const mentions = [...(messageData.mentions || []), ...contentMentions];
  const uniqueMentions = [...new Set(mentions)];

  // Set threadId - if this is a reply, use the parentId's threadId or the parentId itself
  let finalThreadId = messageData.threadId;
  if (messageData.parentId && !finalThreadId) {
    const parentMessage = await prisma.message.findUnique({
      where: { id: messageData.parentId },
      select: { threadId: true, id: true },
    });
    finalThreadId = parentMessage?.threadId || parentMessage?.id;
  }

  const newMessage = await prisma.message.create({
    data: {
      content: messageData.content,
      authorId,
      projectId,
      parentId: messageData.parentId,
      threadId: finalThreadId,
      mentions: uniqueMentions.length > 0 ? uniqueMentions : [],
      attachments: messageData.attachments && messageData.attachments.length > 0 ? messageData.attachments : [],
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
  });

  // Create notifications for mentioned users
  if (uniqueMentions.length > 0) {
    const mentionNotifications = uniqueMentions
      .filter(userId => userId !== authorId) // Don't notify yourself
      .map(userId => ({
        userId,
        fromUserId: authorId,
        projectId,
        type: 'mention',
        title: 'You were mentioned',
        message: `${newMessage.author.name} mentioned you in a message`,
        data: {
          messageId: newMessage.id,
          messageContent: newMessage.content.slice(0, 100),
          threadId: finalThreadId,
          url: `/dashboard/projects/${projectId}/messages?thread=${finalThreadId}`,
        },
      }));

    if (mentionNotifications.length > 0) {
      await prisma.notification.createMany({
        data: mentionNotifications,
      });
    }
  }

  // Create reply notification if this is a reply
  if (messageData.parentId) {
    const parentMessage = await prisma.message.findUnique({
      where: { id: messageData.parentId },
      select: { authorId: true },
    });

    if (parentMessage && parentMessage.authorId !== authorId) {
      await prisma.notification.create({
        data: {
          userId: parentMessage.authorId,
          fromUserId: authorId,
          projectId,
          type: 'reply',
          title: 'New reply to your message',
          message: `${newMessage.author.name} replied to your message`,
          data: {
            messageId: newMessage.id,
            messageContent: newMessage.content.slice(0, 100),
            threadId: finalThreadId,
            url: `/dashboard/projects/${projectId}/messages?thread=${finalThreadId}`,
          },
        },
      });
    }
  }

  // Transform to match our Message interface
  return {
    id: newMessage.id,
    content: newMessage.content,
    authorId: newMessage.authorId,
    projectId: newMessage.projectId,
    parentId: newMessage.parentId,
    threadId: newMessage.threadId,
    mentions: newMessage.mentions,
    attachments: newMessage.attachments,
    reactions: newMessage.reactions.map((reaction: any) => ({
      id: reaction.id,
      emoji: reaction.emoji,
      userId: reaction.userId,
      userName: reaction.user.name,
      createdAt: reaction.createdAt,
    })),
    createdAt: newMessage.createdAt,
    updatedAt: newMessage.updatedAt,
    editedAt: newMessage.editedAt,
    deletedAt: newMessage.deletedAt,
    author: newMessage.author,
    replies: [],
    mentionedUsers: [], // Could be populated from mentions array
    isEdited: newMessage.isEdited,
    replyCount: newMessage._count.replies,
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

    const projectId = params.id;
    const searchParams = req.nextUrl.searchParams;
    
    // Parse query parameters
    const filters: MessageFilters = {
      search: searchParams.get('search') || undefined,
      authorId: searchParams.get('authorId') || undefined,
      onlyMentions: searchParams.get('onlyMentions') === 'true',
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
    };

    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor') || undefined;

    // Verify user has access to the project
    const membership = await prisma.membership.findFirst({
      where: {
        projectId,
        userId: authResult.userId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }

    const result = await getProjectMessages(projectId, filters, limit, cursor);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch project messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const projectId = params.id;
    const body = await req.json();

    // Validate request body
    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content cannot be empty' },
        { status: 400 }
      );
    }

    if (body.content.length > 2000) {
      return NextResponse.json(
        { error: 'Message content too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Verify user has access to the project
    const membership = await prisma.membership.findFirst({
      where: {
        projectId,
        userId: authResult.userId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }

    // If parentId is provided, verify the parent message exists and belongs to the same project
    if (body.parentId) {
      const parentMessage = await prisma.message.findFirst({
        where: {
          id: body.parentId,
          projectId,
          deletedAt: null,
        },
      });

      if (!parentMessage) {
        return NextResponse.json(
          { error: 'Parent message not found or does not belong to this project' },
          { status: 400 }
        );
      }
    }

    const messageData = {
      content: body.content.trim(),
      parentId: body.parentId,
      threadId: body.threadId,
      mentions: body.mentions,
      attachments: body.attachments,
    };

    const message = await createMessage(projectId, messageData, authResult.userId);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Failed to create message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}