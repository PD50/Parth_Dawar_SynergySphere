export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  content: string;
  authorId: string;
  projectId: string;
  parentId?: string; // For threaded replies
  threadId?: string; // Root message ID for threading
  mentions: string[]; // Array of mentioned user IDs
  attachments?: Attachment[];
  reactions?: Reaction[];
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
  
  // Populated fields
  author: User;
  replies?: Message[];
  mentionedUsers?: User[];
  isEdited: boolean;
  replyCount: number;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface MessageThread {
  id: string;
  rootMessage: Message;
  replies: Message[];
  totalReplies: number;
  lastReplyAt?: Date;
  participants: User[];
}

export interface MessageDraft {
  content: string;
  mentions: string[];
  attachments: File[];
  parentId?: string;
  threadId?: string;
}

export interface MessageFilters {
  search?: string;
  authorId?: string;
  hasAttachments?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  onlyMentions?: boolean;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  projectId: string;
  threadId?: string;
  timestamp: Date;
}

export interface MessageState {
  messages: Message[];
  threads: MessageThread[];
  currentThread?: MessageThread;
  filters: MessageFilters;
  typingUsers: TypingIndicator[];
  isLoading: boolean;
  error: string | null;
  hasMoreMessages: boolean;
  lastMessageId?: string;
}