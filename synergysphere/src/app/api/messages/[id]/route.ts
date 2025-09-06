import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getMessageById(messageId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
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

  if (!message || message.deletedAt) {
    return null;
  }

  // Transform to match our Message interface
  return {
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
    mentionedUsers: [], // Could be populated from mentions array
    isEdited: message.isEdited,
    replyCount: message._count.replies,
  };
}

async function updateMessage(messageId: string, updates: {
  content?: string;
  mentions?: string[];
}, userId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      author: { select: { id: true, name: true } },
    },
  });

  if (!message || message.deletedAt) {
    return null;
  }

  // Check if user is the author
  if (message.authorId !== userId) {
    throw new Error('Unauthorized: Only the message author can edit this message');
  }

  // Check if message is not too old (e.g., 15 minutes)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  if (new Date(message.createdAt) < fifteenMinutesAgo) {
    throw new Error('Message is too old to edit');
  }

  const updateData: any = {
    updatedAt: new Date(),
    isEdited: true,
    editedAt: new Date(),
  };

  if (updates.content !== undefined) {
    // Extract mentions from content - handle names with spaces
    const mentionRegex = /@([\w\s]+?)(?=\s[a-z]|$)/g;
    const contentMentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(updates.content)) !== null) {
      const mentionedName = match[1].trim();
      // Look up users by exact name match
      const mentionedUsers = await prisma.user.findMany({
        where: {
          name: mentionedName,
        },
        select: { id: true },
      });
      
      mentionedUsers.forEach(user => {
        if (!contentMentions.includes(user.id)) {
          contentMentions.push(user.id);
        }
      });
    }

    const mentions = [...(updates.mentions || []), ...contentMentions];
    const uniqueMentions = [...new Set(mentions)];

    updateData.content = updates.content;
    updateData.mentions = uniqueMentions;

    // Create notifications for newly mentioned users (not in original mentions)
    const originalMentions = message.mentions as string[] || [];
    const newMentions = uniqueMentions.filter(id => !originalMentions.includes(id));
    
    if (newMentions.length > 0) {
      const mentionNotifications = newMentions
        .filter(userId => userId !== message.authorId) // Don't notify yourself
        .map(userId => ({
          userId,
          fromUserId: message.authorId,
          projectId: message.projectId,
          type: 'mention',
          title: 'You were mentioned',
          message: `${message.author.name} mentioned you in an edited message`,
          data: {
            messageId: message.id,
            messageContent: updates.content!.slice(0, 100),
            threadId: message.threadId,
            url: `/dashboard/projects/${message.projectId}/messages?thread=${message.threadId}`,
          },
        }));

      await prisma.notification.createMany({
        data: mentionNotifications,
      });
    }
  }

  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: updateData,
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

  return {
    id: updatedMessage.id,
    content: updatedMessage.content,
    authorId: updatedMessage.authorId,
    projectId: updatedMessage.projectId,
    parentId: updatedMessage.parentId,
    threadId: updatedMessage.threadId,
    mentions: updatedMessage.mentions,
    attachments: updatedMessage.attachments,
    reactions: updatedMessage.reactions.map((reaction: any) => ({
      id: reaction.id,
      emoji: reaction.emoji,
      userId: reaction.userId,
      userName: reaction.user.name,
      createdAt: reaction.createdAt,
    })),
    createdAt: updatedMessage.createdAt,
    updatedAt: updatedMessage.updatedAt,
    editedAt: updatedMessage.editedAt,
    deletedAt: updatedMessage.deletedAt,
    author: updatedMessage.author,
    replies: [],
    mentionedUsers: [],
    isEdited: updatedMessage.isEdited,
    replyCount: updatedMessage._count.replies,
  };
}

async function deleteMessage(messageId: string, userId: string): Promise<boolean> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message || message.deletedAt) {
    return false;
  }

  // Check if user is the author or has admin permissions
  if (message.authorId !== userId) {
    // TODO: Check if user is project admin
    const membership = await prisma.membership.findFirst({
      where: {
        projectId: message.projectId,
        userId,
        role: { in: ['owner', 'admin'] },
      },
    });

    if (!membership) {
      throw new Error('Unauthorized: Only the message author or project admin can delete this message');
    }
  }

  // Soft delete - mark as deleted but keep in database
  await prisma.message.update({
    where: { id: messageId },
    data: {
      deletedAt: new Date(),
      content: '[This message was deleted]',
    },
  });

  return true;
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
    const message = await getMessageById(messageId);

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify user has access to the project this message belongs to
    const membership = await prisma.membership.findFirst({
      where: {
        projectId: message.projectId,
        userId: authResult.userId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this message' },
        { status: 403 }
      );
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Failed to fetch message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const messageId = params.id;
    const body = await req.json();

    // Validate request body
    if (body.content !== undefined) {
      if (typeof body.content !== 'string') {
        return NextResponse.json(
          { error: 'Message content must be a string' },
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
    }

    const updates = {
      content: body.content?.trim(),
      mentions: body.mentions,
    };

    const updatedMessage = await updateMessage(messageId, updates, authResult.userId);

    if (!updatedMessage) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Failed to update message:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      
      if (error.message.includes('too old')) {
        return NextResponse.json(
          { error: error.message },
          { status: 422 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const messageId = params.id;
    const deleted = await deleteMessage(messageId, authResult.userId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete message:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}