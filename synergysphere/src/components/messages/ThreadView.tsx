"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  MessageSquare, 
  Users,
  ChevronDown,
  ArrowUp
} from "lucide-react";
import { MessageItem } from "./MessageItem";
import { MessageComposer } from "./MessageComposer";
import { MessageThread, Message } from "@/types/messages";
import { cn } from "@/lib/utils";

interface ThreadViewProps {
  thread: MessageThread;
  currentUserId?: string;
  isOpen: boolean;
  onClose: () => void;
  onReply: (content: string, parentId: string, threadId: string) => Promise<void>;
  onEditMessage: (message: Message) => Promise<void>;
  onDeleteMessage: (message: Message) => Promise<void>;
  onReaction: (messageId: string, emoji: string) => Promise<void>;
  className?: string;
}

export function ThreadView({
  thread,
  currentUserId,
  isOpen,
  onClose,
  onReply,
  onEditMessage,
  onDeleteMessage,
  onReaction,
  className
}: ThreadViewProps) {
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new replies are added
  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thread.replies.length, isOpen]);

  // Show a limited number of replies initially
  const maxVisibleReplies = 10;
  const visibleReplies = showAllReplies 
    ? thread.replies 
    : thread.replies.slice(-maxVisibleReplies);
  
  const hiddenRepliesCount = thread.replies.length - maxVisibleReplies;

  const handleReply = async (content: string) => {
    try {
      await onReply(content, thread.rootMessage.id, thread.id);
      // Scroll to bottom after successful reply
      setTimeout(() => {
        if (bottomRef.current) {
          bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  };

  const scrollToTop = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg z-50 flex flex-col",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-medium">Thread</h3>
            <p className="text-sm text-muted-foreground">
              {thread.totalReplies} {thread.totalReplies === 1 ? 'reply' : 'replies'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Thread participants */}
      <div className="px-4 py-2 border-b bg-muted/20">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-1">
            {thread.participants.map((participant) => (
              <Badge key={participant.id} variant="secondary" className="text-xs">
                {participant.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {/* Root message */}
          <div className="pb-4 border-b">
            <MessageItem
              message={thread.rootMessage}
              currentUserId={currentUserId}
              showReplyButton={false}
              onEdit={onEditMessage}
              onDelete={onDeleteMessage}
              onReaction={onReaction}
              className="bg-muted/30 rounded-lg"
            />
          </div>

          {/* Load more replies button */}
          {!showAllReplies && hiddenRepliesCount > 0 && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllReplies(true)}
                className="text-muted-foreground"
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                Load {hiddenRepliesCount} earlier {hiddenRepliesCount === 1 ? 'reply' : 'replies'}
              </Button>
            </div>
          )}

          {/* Replies */}
          <div className="space-y-3">
            {visibleReplies.map((reply) => (
              <MessageItem
                key={reply.id}
                message={reply}
                currentUserId={currentUserId}
                isReply={true}
                showReplyButton={false}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
                onReaction={onReaction}
              />
            ))}
          </div>

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Scroll to top button */}
      {thread.replies.length > 5 && (
        <div className="absolute bottom-20 right-4">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full h-10 w-10 p-0 shadow-md"
            onClick={scrollToTop}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Reply composer */}
      <div className={cn(
        "border-t bg-background",
        isComposerFocused && "border-primary"
      )}>
        <MessageComposer
          placeholder={`Reply to ${thread.rootMessage.author.name}...`}
          onSend={handleReply}
          onFocusChange={setIsComposerFocused}
          showAttachments={false}
          compact={true}
          className="border-0"
        />
      </div>
    </div>
  );
}