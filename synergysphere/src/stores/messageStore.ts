import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";
import { 
  Message, 
  MessageThread, 
  MessageFilters, 
  MessageDraft, 
  TypingIndicator,
  MessageState 
} from "@/types/messages";

interface MessageStore extends MessageState {
  // Message Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  
  // Thread Actions  
  setCurrentThread: (thread: MessageThread | undefined) => void;
  addReplyToThread: (threadId: string, reply: Message) => void;
  updateThreadMessage: (threadId: string, messageId: string, updates: Partial<Message>) => void;
  
  // Filter Actions
  setFilters: (filters: Partial<MessageFilters>) => void;
  clearFilters: () => void;
  getFilteredMessages: (projectId?: string) => Message[];
  
  // Draft Actions
  setDraft: (draft: Partial<MessageDraft>) => void;
  clearDraft: () => void;
  getDraft: () => MessageDraft;
  
  // Typing Indicators
  addTypingUser: (indicator: TypingIndicator) => void;
  removeTypingUser: (userId: string, threadId?: string) => void;
  clearTypingUsers: () => void;
  getTypingUsers: (threadId?: string) => TypingIndicator[];
  
  // Loading and Error States
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Real-time Updates
  handleRealTimeMessage: (message: Message) => void;
  handleRealTimeMessageUpdate: (message: Message) => void;
  handleRealTimeMessageDelete: (messageId: string) => void;
  handleRealTimeTyping: (indicator: TypingIndicator) => void;
  handleRealTimeStopTyping: (userId: string, threadId?: string) => void;
  
  // Pagination
  setHasMoreMessages: (hasMore: boolean) => void;
  setLastMessageId: (messageId: string | undefined) => void;
  
  // Utility Actions
  getMessageById: (messageId: string) => Message | undefined;
  getThreadById: (threadId: string) => MessageThread | undefined;
  getMessageThread: (messageId: string) => Message[];
  markThreadAsRead: (threadId: string) => void;
  
  // Search and Filtering
  searchMessages: (query: string, projectId?: string) => Message[];
  getMessagesByAuthor: (authorId: string, projectId?: string) => Message[];
  getMessagesWithMentions: (userId: string, projectId?: string) => Message[];
}

const initialDraft: MessageDraft = {
  content: "",
  mentions: [],
  attachments: []
};

const filterMessages = (messages: Message[], filters: MessageFilters, projectId?: string): Message[] => {
  return messages.filter((message) => {
    // Project filter
    if (projectId && message.projectId !== projectId) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const contentMatch = message.content.toLowerCase().includes(searchTerm);
      const authorMatch = message.author.name.toLowerCase().includes(searchTerm);
      if (!contentMatch && !authorMatch) {
        return false;
      }
    }

    // Author filter
    if (filters.authorId && message.authorId !== filters.authorId) {
      return false;
    }

    // Attachments filter
    if (filters.hasAttachments && (!message.attachments || message.attachments.length === 0)) {
      return false;
    }

    // Date range filters
    if (filters.dateFrom && new Date(message.createdAt) < new Date(filters.dateFrom)) {
      return false;
    }

    if (filters.dateTo && new Date(message.createdAt) > new Date(filters.dateTo)) {
      return false;
    }

    // Mentions filter
    if (filters.onlyMentions && (!message.mentions || message.mentions.length === 0)) {
      return false;
    }

    return true;
  });
};

const buildMessageThreads = (messages: Message[]): MessageThread[] => {
  const threadsMap = new Map<string, MessageThread>();
  
  // Find root messages and create thread objects
  messages.forEach(message => {
    if (!message.parentId) {
      // This is a root message
      const threadId = message.threadId || message.id;
      if (!threadsMap.has(threadId)) {
        threadsMap.set(threadId, {
          id: threadId,
          rootMessage: message,
          replies: [],
          totalReplies: 0,
          participants: [message.author]
        });
      }
    }
  });
  
  // Add replies to threads
  messages.forEach(message => {
    if (message.parentId && message.threadId) {
      const thread = threadsMap.get(message.threadId);
      if (thread) {
        thread.replies.push(message);
        thread.totalReplies++;
        
        // Add participant if not already included
        if (!thread.participants.find(p => p.id === message.author.id)) {
          thread.participants.push(message.author);
        }
        
        // Update last reply timestamp
        if (!thread.lastReplyAt || new Date(message.createdAt) > new Date(thread.lastReplyAt)) {
          thread.lastReplyAt = new Date(message.createdAt);
        }
      }
    }
  });
  
  // Sort replies in each thread by creation time
  threadsMap.forEach(thread => {
    thread.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });
  
  return Array.from(threadsMap.values());
};

export const useMessageStore = create<MessageStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      messages: [],
      threads: [],
      currentThread: undefined,
      filters: {},
      typingUsers: [],
      isLoading: false,
      error: null,
      hasMoreMessages: true,
      lastMessageId: undefined,

      // Message Actions
      setMessages: (messages) =>
        set((state) => {
          state.messages = messages;
          state.threads = buildMessageThreads(messages);
        }),

      addMessage: (message) =>
        set((state) => {
          state.messages.push(message);
          state.threads = buildMessageThreads(state.messages);
          
          // Update current thread if this message belongs to it
          if (state.currentThread && 
              (message.threadId === state.currentThread.id || message.id === state.currentThread.id)) {
            const updatedThread = state.threads.find(t => t.id === state.currentThread!.id);
            if (updatedThread) {
              state.currentThread = updatedThread;
            }
          }
        }),

      updateMessage: (messageId, updates) =>
        set((state) => {
          const messageIndex = state.messages.findIndex((msg) => msg.id === messageId);
          if (messageIndex !== -1) {
            Object.assign(state.messages[messageIndex], updates);
            state.threads = buildMessageThreads(state.messages);
            
            // Update current thread if needed
            if (state.currentThread) {
              const updatedThread = state.threads.find(t => t.id === state.currentThread!.id);
              if (updatedThread) {
                state.currentThread = updatedThread;
              }
            }
          }
        }),

      removeMessage: (messageId) =>
        set((state) => {
          state.messages = state.messages.filter((msg) => msg.id !== messageId);
          state.threads = buildMessageThreads(state.messages);
          
          // Update current thread if needed
          if (state.currentThread) {
            const updatedThread = state.threads.find(t => t.id === state.currentThread!.id);
            state.currentThread = updatedThread;
          }
        }),

      // Thread Actions
      setCurrentThread: (thread) =>
        set((state) => {
          state.currentThread = thread;
        }),

      addReplyToThread: (threadId, reply) =>
        set((state) => {
          state.messages.push(reply);
          state.threads = buildMessageThreads(state.messages);
          
          // Update current thread if this is the active thread
          if (state.currentThread && state.currentThread.id === threadId) {
            const updatedThread = state.threads.find(t => t.id === threadId);
            if (updatedThread) {
              state.currentThread = updatedThread;
            }
          }
        }),

      updateThreadMessage: (threadId, messageId, updates) =>
        set((state) => {
          const messageIndex = state.messages.findIndex((msg) => msg.id === messageId);
          if (messageIndex !== -1) {
            Object.assign(state.messages[messageIndex], updates);
            state.threads = buildMessageThreads(state.messages);
            
            // Update current thread if this is the active thread
            if (state.currentThread && state.currentThread.id === threadId) {
              const updatedThread = state.threads.find(t => t.id === threadId);
              if (updatedThread) {
                state.currentThread = updatedThread;
              }
            }
          }
        }),

      // Filter Actions
      setFilters: (filters) =>
        set((state) => {
          Object.assign(state.filters, filters);
        }),

      clearFilters: () =>
        set((state) => {
          state.filters = {};
        }),

      getFilteredMessages: (projectId) => {
        const { messages, filters } = get();
        return filterMessages(messages, filters, projectId);
      },

      // Draft Actions
      setDraft: (draft) =>
        set((state) => {
          Object.assign(state.draft || initialDraft, draft);
        }),

      clearDraft: () =>
        set((state) => {
          state.draft = { ...initialDraft };
        }),

      getDraft: () => {
        const state = get();
        return state.draft || { ...initialDraft };
      },

      // Typing Indicators
      addTypingUser: (indicator) =>
        set((state) => {
          // Remove existing indicator for same user/thread
          state.typingUsers = state.typingUsers.filter(
            (existing) => 
              existing.userId !== indicator.userId || 
              existing.threadId !== indicator.threadId
          );
          
          // Add new indicator
          state.typingUsers.push(indicator);
        }),

      removeTypingUser: (userId, threadId) =>
        set((state) => {
          state.typingUsers = state.typingUsers.filter(
            (indicator) => 
              indicator.userId !== userId || 
              (threadId && indicator.threadId !== threadId)
          );
        }),

      clearTypingUsers: () =>
        set((state) => {
          state.typingUsers = [];
        }),

      getTypingUsers: (threadId) => {
        const { typingUsers } = get();
        if (threadId) {
          return typingUsers.filter(indicator => indicator.threadId === threadId);
        }
        return typingUsers.filter(indicator => !indicator.threadId);
      },

      // Loading and Error States
      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      // Real-time Updates
      handleRealTimeMessage: (message) =>
        set((state) => {
          // Check if message already exists
          const existingIndex = state.messages.findIndex(msg => msg.id === message.id);
          if (existingIndex === -1) {
            state.messages.push(message);
            state.threads = buildMessageThreads(state.messages);
          }
        }),

      handleRealTimeMessageUpdate: (message) =>
        set((state) => {
          const messageIndex = state.messages.findIndex(msg => msg.id === message.id);
          if (messageIndex !== -1) {
            state.messages[messageIndex] = message;
            state.threads = buildMessageThreads(state.messages);
          }
        }),

      handleRealTimeMessageDelete: (messageId) =>
        set((state) => {
          state.messages = state.messages.filter(msg => msg.id !== messageId);
          state.threads = buildMessageThreads(state.messages);
        }),

      handleRealTimeTyping: (indicator) =>
        set((state) => {
          get().addTypingUser(indicator);
        }),

      handleRealTimeStopTyping: (userId, threadId) =>
        set((state) => {
          get().removeTypingUser(userId, threadId);
        }),

      // Pagination
      setHasMoreMessages: (hasMore) =>
        set((state) => {
          state.hasMoreMessages = hasMore;
        }),

      setLastMessageId: (messageId) =>
        set((state) => {
          state.lastMessageId = messageId;
        }),

      // Utility Actions
      getMessageById: (messageId) => {
        const { messages } = get();
        return messages.find(msg => msg.id === messageId);
      },

      getThreadById: (threadId) => {
        const { threads } = get();
        return threads.find(thread => thread.id === threadId);
      },

      getMessageThread: (messageId) => {
        const { messages } = get();
        const message = messages.find(msg => msg.id === messageId);
        if (!message) return [];
        
        const threadId = message.threadId || message.id;
        return messages
          .filter(msg => msg.threadId === threadId || msg.id === threadId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      },

      markThreadAsRead: (threadId) => {
        // TODO: Implement read status for messages/threads
        // This would typically involve API calls to mark messages as read
      },

      // Search and Filtering
      searchMessages: (query, projectId) => {
        const { messages } = get();
        return filterMessages(messages, { search: query }, projectId);
      },

      getMessagesByAuthor: (authorId, projectId) => {
        const { messages } = get();
        return filterMessages(messages, { authorId }, projectId);
      },

      getMessagesWithMentions: (userId, projectId) => {
        const { messages } = get();
        return messages.filter(msg => 
          msg.mentions.includes(userId) && 
          (!projectId || msg.projectId === projectId)
        );
      },
    }))
  )
);