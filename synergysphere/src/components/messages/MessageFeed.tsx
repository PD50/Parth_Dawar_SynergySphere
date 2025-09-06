"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Search, 
  Filter,
  ArrowDown,
  Users,
  Hash
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageItem } from "./MessageItem";
import { MessageComposer } from "./MessageComposer";
import { ThreadView } from "./ThreadView";
import { Message, MessageThread, MessageFilters, TypingIndicator } from "@/types/messages";
import { useMessageStore } from "@/stores/messageStore";
import { cn } from "@/lib/utils";

interface MessageFeedProps {
  projectId: string;
  currentUserId?: string;
  className?: string;
}

export function MessageFeed({ projectId, currentUserId, className }: MessageFeedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    threads,
    filters,
    isLoading,
    error,
    typingUsers,
    getFilteredMessages,
    setFilters,
    clearFilters,
    addMessage,
    updateMessage,
    removeMessage,
    getTypingUsers,
    setCurrentThread,
    currentThread,
    setMessages,
    setLoading,
    setError
  } = useMessageStore();

  // Get filtered messages for the current project
  const projectMessages = useMemo(() => {
    return getFilteredMessages(projectId);
  }, [getFilteredMessages, projectId, messages, filters]);

  // Get only root messages (not replies) for the main feed
  const rootMessages = useMemo(() => {
    return projectMessages.filter(message => !message.parentId);
  }, [projectMessages]);

  // Get typing indicators for current project
  const currentTypingUsers = useMemo(() => {
    return getTypingUsers().filter(indicator => 
      indicator.projectId === projectId && 
      indicator.userId !== currentUserId
    );
  }, [getTypingUsers, projectId, currentUserId]);

  // Load messages for the project with debouncing to prevent duplicate calls
  const loadMessages = async (silent = false) => {
    // Prevent multiple concurrent API calls
    if (isLoadingMessages) {
      return;
    }
    
    try {
      setIsLoadingMessages(true);
      if (!silent) {
        setLoading(true);
      }
      const response = await fetch(`/api/projects/${projectId}/messages?limit=50`);
      
      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.statusText}`);
      }
      
      const data = await response.json();
      const newMessages = data.messages || [];
      
      // Always update messages to ensure real-time updates work
      setMessages(newMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      if (!silent) {
        setError(error instanceof Error ? error.message : 'Failed to load messages');
      }
    } finally {
      setIsLoadingMessages(false);
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Load messages when component mounts or projectId changes
  useEffect(() => {
    if (projectId) {
      loadMessages();
    }
  }, [projectId]);

  // Smart polling - only poll when page is visible and user not typing
  useEffect(() => {
    if (!projectId) return;
    
    let pollInterval: NodeJS.Timeout;
    
    const startPolling = () => {
      // Clear any existing interval
      if (pollInterval) clearInterval(pollInterval);
      
      pollInterval = setInterval(() => {
        // Only poll if:
        // 1. Page is visible (user is actively viewing)
        // 2. User is not typing
        // 3. Document is focused
        if (!document.hidden && !isComposerFocused && document.hasFocus()) {
          loadMessages(true); // Silent polling
        }
      }, 8000); // Reduced to 8 seconds for better performance
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, stop polling
        if (pollInterval) clearInterval(pollInterval);
      } else {
        // Page is visible, resume polling
        startPolling();
        // Immediately fetch when page becomes visible
        loadMessages(true);
      }
    };
    
    // Start initial polling
    startPolling();
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [projectId, isComposerFocused]);

  // Handle scroll to detect when user is at bottom
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollToBottom(!isNearBottom);
  };

  // Auto-scroll to bottom when new messages arrive (if user is near bottom)
  useEffect(() => {
    if (bottomRef.current && !showScrollToBottom) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [projectMessages.length, showScrollToBottom]);

  const handleSendMessage = async (content: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const newMessage = await response.json();
      addMessage(newMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const handleReplyToMessage = (message: Message) => {
    const thread = threads.find(t => t.id === (message.threadId || message.id));
    if (thread) {
      setSelectedThread(thread);
      setCurrentThread(thread);
    }
  };

  const handleThreadReply = async (content: string, parentId: string, threadId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId, threadId })
      });

      if (!response.ok) {
        throw new Error(`Failed to send reply: ${response.statusText}`);
      }

      const newReply = await response.json();
      addMessage(newReply);

      // Update the current thread
      const updatedThread = threads.find(t => t.id === threadId);
      if (updatedThread) {
        setSelectedThread(updatedThread);
        setCurrentThread(updatedThread);
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      throw error;
    }
  };

  const handleEditMessage = async (message: Message) => {
    try {
      const response = await fetch(`/api/messages/${message.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message.content, mentions: message.mentions })
      });

      if (!response.ok) {
        throw new Error(`Failed to edit message: ${response.statusText}`);
      }

      const updatedMessage = await response.json();
      updateMessage(message.id, updatedMessage);
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    try {
      const response = await fetch(`/api/messages/${message.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.statusText}`);
      }

      removeMessage(message.id);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });

      if (!response.ok) {
        throw new Error(`Failed to add reaction: ${response.statusText}`);
      }

      // Refresh the message to get updated reactions
      const messageResponse = await fetch(`/api/messages/${messageId}`);
      if (messageResponse.ok) {
        const updatedMessage = await messageResponse.json();
        updateMessage(messageId, updatedMessage);
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  };

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFilterChange = (key: keyof MessageFilters, value: any) => {
    setFilters({ [key]: value });
  };

  return (
    <div className={cn("flex h-full", className)}>
      {/* Main message feed */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b gap-3 sm:gap-0">
          <div className="flex items-center space-x-2">
            <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <h2 className="text-sm sm:text-base font-semibold">Project Discussion</h2>
            <Badge variant="secondary" className="ml-2 text-xs">
              {rootMessages.length} messages
            </Badge>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64 text-sm sm:text-base"
              />
            </div>

            {/* Filters */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="px-2 sm:px-3">
                  <Filter className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter Messages</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={filters.onlyMentions}
                  onCheckedChange={(checked) => handleFilterChange('onlyMentions', checked)}
                >
                  Only @mentions
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.hasAttachments}
                  onCheckedChange={(checked) => handleFilterChange('hasAttachments', checked)}
                >
                  Has attachments
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={false}
                  onCheckedChange={() => clearFilters()}
                >
                  Clear all filters
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea 
          ref={scrollAreaRef}
          className="flex-1 min-h-0"
          onScrollCapture={handleScroll}
        >
          <div className="flex flex-col justify-end min-h-full">
            {rootMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col pt-4">
                {rootMessages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    currentUserId={currentUserId}
                    onReply={handleReplyToMessage}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                    onReaction={handleReaction}
                  />
                ))}

                {/* Typing indicators */}
                {currentTypingUsers.length > 0 && (
                  <div className="flex justify-start px-4 mb-4">
                    <div className="flex items-center space-x-3 bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {currentTypingUsers.map(u => u.userName).join(', ')} 
                        {currentTypingUsers.length === 1 ? ' is' : ' are'} typing...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <div className="absolute bottom-24 right-8 z-10">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full h-10 w-10 p-0 shadow-lg"
              onClick={scrollToBottom}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Message composer */}
        <div className={cn(
          "p-2 sm:p-4 border-t bg-background",
          isComposerFocused && "border-primary"
        )}>
          <MessageComposer
            placeholder="Type a message..."
            onSend={handleSendMessage}
            onFocusChange={setIsComposerFocused}
            onTyping={(isTyping) => {
              // Handle typing indicator
              console.log('Typing:', isTyping);
            }}
            compact={typeof window !== 'undefined' && window.innerWidth < 640}
          />
        </div>
      </div>

      {/* Thread sidebar */}
      {selectedThread && (
        <ThreadView
          thread={selectedThread}
          currentUserId={currentUserId}
          isOpen={true}
          onClose={() => {
            setSelectedThread(null);
            setCurrentThread(undefined);
          }}
          onReply={handleThreadReply}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onReaction={handleReaction}
        />
      )}
    </div>
  );
}