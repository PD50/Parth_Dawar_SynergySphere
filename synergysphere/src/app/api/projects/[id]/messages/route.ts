import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Message, MessageFilters } from '@/types/messages';

// Mock database functions - replace with actual database implementation
const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hey team! Just wanted to update everyone on the current sprint progress. We\'re making great progress on the authentication system.',
    authorId: '1',
    projectId: '1',
    mentions: ['2', '3'],
    attachments: [],
    reactions: [
      { id: '1', emoji: '👍', userId: '2', userName: 'Bob Smith', createdAt: new Date('2024-01-25T10:30:00Z') },
      { id: '2', emoji: '🚀', userId: '3', userName: 'Carol Davis', createdAt: new Date('2024-01-25T10:35:00Z') }
    ],
    createdAt: new Date('2024-01-25T09:00:00Z'),
    updatedAt: new Date('2024-01-25T09:00:00Z'),
    author: {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@synergysphere.com',
      avatarUrl: ''
    },
    replies: [],
    mentionedUsers: [
      { id: '2', name: 'Bob Smith', email: 'bob@synergysphere.com' },
      { id: '3', name: 'Carol Davis', email: 'carol@synergysphere.com' }
    ],
    isEdited: false,
    replyCount: 2
  },
  {
    id: '2',
    content: 'Thanks for the update @alice! The login flow is working smoothly on my end. Should we schedule a review session for the API endpoints?',
    authorId: '2',
    projectId: '1',
    parentId: '1',
    threadId: '1',
    mentions: ['1'],
    attachments: [],
    reactions: [],
    createdAt: new Date('2024-01-25T09:15:00Z'),
    updatedAt: new Date('2024-01-25T09:15:00Z'),
    author: {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@synergysphere.com',
      avatarUrl: ''
    },
    replies: [],
    mentionedUsers: [
      { id: '1', name: 'Alice Johnson', email: 'alice@synergysphere.com' }
    ],
    isEdited: false,
    replyCount: 0
  }
];

const mockProjectMembers = [
  { id: '1', name: 'Alice Johnson', email: 'alice@synergysphere.com', avatarUrl: '' },
  { id: '2', name: 'Bob Smith', email: 'bob@synergysphere.com', avatarUrl: '' },
  { id: '3', name: 'Carol Davis', email: 'carol@synergysphere.com', avatarUrl: '' },
  { id: '4', name: 'David Wilson', email: 'david@synergysphere.com', avatarUrl: '' },
];

async function getProjectMessages(
  projectId: string,
  filters: MessageFilters = {},
  limit: number = 50,
  cursor?: string
): Promise<{ messages: Message[], hasMore: boolean, nextCursor?: string }> {
  // In a real app, this would query the database
  let filteredMessages = mockMessages.filter(message => message.projectId === projectId);

  // Apply filters
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredMessages = filteredMessages.filter(message =>
      message.content.toLowerCase().includes(searchTerm) ||
      message.author.name.toLowerCase().includes(searchTerm)
    );
  }

  if (filters.authorId) {
    filteredMessages = filteredMessages.filter(message => message.authorId === filters.authorId);
  }

  if (filters.hasAttachments) {
    filteredMessages = filteredMessages.filter(message => 
      message.attachments && message.attachments.length > 0
    );
  }

  if (filters.onlyMentions) {
    // Filter for messages where the current user is mentioned
    // This would need the current user ID from the auth context
    filteredMessages = filteredMessages.filter(message => 
      message.mentions && message.mentions.length > 0
    );
  }

  if (filters.dateFrom) {
    filteredMessages = filteredMessages.filter(message =>
      new Date(message.createdAt) >= new Date(filters.dateFrom!)
    );
  }

  if (filters.dateTo) {
    filteredMessages = filteredMessages.filter(message =>
      new Date(message.createdAt) <= new Date(filters.dateTo!)
    );
  }

  // Sort by creation date (newest first)
  filteredMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Implement pagination
  const startIndex = cursor ? filteredMessages.findIndex(m => m.id === cursor) + 1 : 0;
  const endIndex = startIndex + limit;
  const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

  return {
    messages: paginatedMessages,
    hasMore: endIndex < filteredMessages.length,
    nextCursor: paginatedMessages.length > 0 ? paginatedMessages[paginatedMessages.length - 1].id : undefined
  };
}

async function createMessage(projectId: string, messageData: {
  content: string;
  parentId?: string;
  threadId?: string;
  mentions?: string[];
  attachments?: any[];
}, authorId: string): Promise<Message> {
  // Extract mentions from content (simple implementation)
  const mentionRegex = /@(\w+)/g;
  const contentMentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(messageData.content)) !== null) {
    const mentionedUser = mockProjectMembers.find(member => 
      member.name.toLowerCase().includes(match[1].toLowerCase())
    );
    if (mentionedUser && !contentMentions.includes(mentionedUser.id)) {
      contentMentions.push(mentionedUser.id);
    }
  }

  const mentions = [...(messageData.mentions || []), ...contentMentions];
  const uniqueMentions = [...new Set(mentions)];

  const newMessage: Message = {
    id: Math.random().toString(36).substr(2, 9),
    content: messageData.content,
    authorId,
    projectId,
    parentId: messageData.parentId,
    threadId: messageData.threadId || messageData.parentId,
    mentions: uniqueMentions,
    attachments: messageData.attachments || [],
    reactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: mockProjectMembers.find(member => member.id === authorId)!,
    replies: [],
    mentionedUsers: uniqueMentions.map(id => mockProjectMembers.find(member => member.id === id)!).filter(Boolean),
    isEdited: false,
    replyCount: 0
  };

  // Add to mock database
  mockMessages.push(newMessage);

  // TODO: Create notifications for mentioned users
  // TODO: Update thread reply count if this is a reply
  
  return newMessage;
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
      hasAttachments: searchParams.get('hasAttachments') === 'true',
      onlyMentions: searchParams.get('onlyMentions') === 'true',
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
    };

    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor') || undefined;

    // TODO: Verify user has access to the project

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

    // TODO: Verify user has access to the project
    // TODO: If parentId is provided, verify the parent message exists

    const messageData = {
      content: body.content.trim(),
      parentId: body.parentId,
      threadId: body.threadId,
      mentions: body.mentions,
      attachments: body.attachments
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