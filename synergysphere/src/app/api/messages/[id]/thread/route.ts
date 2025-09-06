import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Message, MessageThread } from '@/types/messages';

// Mock database - replace with actual database implementation
const mockMessages: Message[] = []; // This should be the same array as in other message routes

const mockProjectMembers = [
  { id: '1', name: 'Alice Johnson', email: 'alice@synergysphere.com', avatarUrl: '' },
  { id: '2', name: 'Bob Smith', email: 'bob@synergysphere.com', avatarUrl: '' },
  { id: '3', name: 'Carol Davis', email: 'carol@synergysphere.com', avatarUrl: '' },
  { id: '4', name: 'David Wilson', email: 'david@synergysphere.com', avatarUrl: '' },
];

async function getMessageThread(rootMessageId: string): Promise<MessageThread | null> {
  // Find the root message
  const rootMessage = mockMessages.find(message => message.id === rootMessageId);
  if (!rootMessage) return null;

  // If this message is actually a reply, find the real root
  const actualRootId = rootMessage.threadId || rootMessageId;
  const actualRootMessage = mockMessages.find(message => message.id === actualRootId);
  if (!actualRootMessage) return null;

  // Find all replies in this thread
  const replies = mockMessages
    .filter(message => 
      message.threadId === actualRootId && 
      message.id !== actualRootId &&
      !message.deletedAt
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Get unique participants in the thread
  const participantIds = new Set([
    actualRootMessage.authorId,
    ...replies.map(reply => reply.authorId)
  ]);

  const participants = Array.from(participantIds)
    .map(id => mockProjectMembers.find(member => member.id === id)!)
    .filter(Boolean);

  const lastReplyAt = replies.length > 0 
    ? replies[replies.length - 1].createdAt 
    : actualRootMessage.createdAt;

  const thread: MessageThread = {
    id: actualRootId,
    rootMessage: actualRootMessage,
    replies,
    totalReplies: replies.length,
    lastReplyAt: new Date(lastReplyAt),
    participants
  };

  return thread;
}

async function getThreadReplies(
  rootMessageId: string, 
  limit: number = 50, 
  cursor?: string
): Promise<{ replies: Message[], hasMore: boolean, nextCursor?: string }> {
  // Find all replies in this thread
  let replies = mockMessages
    .filter(message => 
      message.threadId === rootMessageId && 
      message.id !== rootMessageId &&
      !message.deletedAt
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Implement pagination
  const startIndex = cursor ? replies.findIndex(r => r.id === cursor) + 1 : 0;
  const endIndex = startIndex + limit;
  const paginatedReplies = replies.slice(startIndex, endIndex);

  return {
    replies: paginatedReplies,
    hasMore: endIndex < replies.length,
    nextCursor: paginatedReplies.length > 0 
      ? paginatedReplies[paginatedReplies.length - 1].id 
      : undefined
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

    if (includeRoot) {
      // Return full thread with root message and replies
      const thread = await getMessageThread(messageId);
      
      if (!thread) {
        return NextResponse.json(
          { error: 'Thread not found' },
          { status: 404 }
        );
      }

      // TODO: Verify user has access to the project this thread belongs to

      return NextResponse.json(thread);
    } else {
      // Return only replies with pagination
      const result = await getThreadReplies(messageId, limit, cursor);
      
      // Verify the root message exists
      const rootMessage = mockMessages.find(message => message.id === messageId);
      if (!rootMessage) {
        return NextResponse.json(
          { error: 'Root message not found' },
          { status: 404 }
        );
      }

      // TODO: Verify user has access to the project this thread belongs to

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