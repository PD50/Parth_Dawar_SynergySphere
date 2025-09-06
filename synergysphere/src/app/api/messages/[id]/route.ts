import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Message } from '@/types/messages';

// Mock database - replace with actual database implementation
const mockMessages: Message[] = []; // This should be the same array as in the project messages route

const mockProjectMembers = [
  { id: '1', name: 'Alice Johnson', email: 'alice@synergysphere.com', avatarUrl: '' },
  { id: '2', name: 'Bob Smith', email: 'bob@synergysphere.com', avatarUrl: '' },
  { id: '3', name: 'Carol Davis', email: 'carol@synergysphere.com', avatarUrl: '' },
  { id: '4', name: 'David Wilson', email: 'david@synergysphere.com', avatarUrl: '' },
];

async function getMessageById(messageId: string): Promise<Message | null> {
  // In a real app, this would query the database
  return mockMessages.find(message => message.id === messageId) || null;
}

async function updateMessage(messageId: string, updates: {
  content?: string;
  mentions?: string[];
}, userId: string): Promise<Message | null> {
  const messageIndex = mockMessages.findIndex(message => message.id === messageId);
  if (messageIndex === -1) return null;

  const message = mockMessages[messageIndex];
  
  // Check if user is the author
  if (message.authorId !== userId) {
    throw new Error('Unauthorized: Only the message author can edit this message');
  }

  // Check if message is not too old (e.g., 15 minutes)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  if (new Date(message.createdAt) < fifteenMinutesAgo) {
    throw new Error('Message is too old to edit');
  }

  // Update the message
  if (updates.content !== undefined) {
    // Extract mentions from content
    const mentionRegex = /@(\w+)/g;
    const contentMentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(updates.content)) !== null) {
      const mentionedUser = mockProjectMembers.find(member => 
        member.name.toLowerCase().includes(match[1].toLowerCase())
      );
      if (mentionedUser && !contentMentions.includes(mentionedUser.id)) {
        contentMentions.push(mentionedUser.id);
      }
    }

    const mentions = [...(updates.mentions || []), ...contentMentions];
    const uniqueMentions = [...new Set(mentions)];

    message.content = updates.content;
    message.mentions = uniqueMentions;
    message.mentionedUsers = uniqueMentions
      .map(id => mockProjectMembers.find(member => member.id === id)!)
      .filter(Boolean);
  }

  message.updatedAt = new Date();
  message.editedAt = new Date();
  message.isEdited = true;

  mockMessages[messageIndex] = message;

  // TODO: Create notifications for newly mentioned users
  // TODO: Emit real-time update

  return message;
}

async function deleteMessage(messageId: string, userId: string): Promise<boolean> {
  const messageIndex = mockMessages.findIndex(message => message.id === messageId);
  if (messageIndex === -1) return false;

  const message = mockMessages[messageIndex];
  
  // Check if user is the author or has admin permissions
  if (message.authorId !== userId) {
    // TODO: Check if user is project admin
    throw new Error('Unauthorized: Only the message author can delete this message');
  }

  // Soft delete - mark as deleted but keep in database
  message.deletedAt = new Date();
  message.content = '[This message was deleted]';
  mockMessages[messageIndex] = message;

  // TODO: Emit real-time update

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

    // TODO: Verify user has access to the project this message belongs to

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
      mentions: body.mentions
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