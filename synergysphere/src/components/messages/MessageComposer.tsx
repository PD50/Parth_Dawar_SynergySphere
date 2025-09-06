"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, 
  Paperclip, 
  Smile,
  AtSign,
  Bold,
  Italic,
  Code
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MentionAutocomplete } from "./MentionAutocomplete";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
  placeholder?: string;
  value?: string;
  onSend: (content: string) => Promise<void>;
  onFocusChange?: (focused: boolean) => void;
  onTyping?: (isTyping: boolean) => void;
  showAttachments?: boolean;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
}

export function MessageComposer({
  placeholder = "Type a message...",
  value = "",
  onSend,
  onFocusChange,
  onTyping,
  showAttachments = true,
  compact = false,
  disabled = false,
  className,
  maxLength = 2000
}: MessageComposerProps) {
  const [content, setContent] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle typing indicators
  useEffect(() => {
    if (onTyping && content.length > 0) {
      onTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [content, onTyping]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = compact ? 100 : 200;
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    }
  }, [content, compact]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onFocusChange?.(false);
    if (onTyping) {
      onTyping(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setContent(newContent);
    setCursorPosition(cursorPos);
    
    // Check for @mentions
    const beforeCursor = newContent.slice(0, cursorPos);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery("");
    }
  };

  const handleMentionSelect = (user: { id: string; name: string; email: string }) => {
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const beforeMention = beforeCursor.slice(0, mentionMatch.index);
      const newContent = `${beforeMention}@${user.name} ${afterCursor}`;
      setContent(newContent);
      setShowMentions(false);
      setMentionQuery("");
      
      // Focus back to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeMention.length + user.name.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!content.trim() || isSubmitting || disabled) return;
    
    try {
      setIsSubmitting(true);
      await onSend(content.trim());
      setContent("");
      setShowMentions(false);
      setMentionQuery("");
      if (onTyping) {
        onTyping(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    
    // Close mentions on Escape
    if (e.key === 'Escape' && showMentions) {
      setShowMentions(false);
      setMentionQuery("");
    }
  };

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);
    const newContent = content.slice(0, start) + before + selectedText + after + content.slice(end);
    
    setContent(newContent);
    
    // Restore cursor position
    setTimeout(() => {
      const newCursorPos = start + before.length + selectedText.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const characterCount = content.length;
  const isOverLimit = characterCount > maxLength;
  const canSend = content.trim().length > 0 && !isOverLimit && !isSubmitting && !disabled;

  return (
    <div className={cn(
      "border rounded-lg bg-background",
      isFocused && "ring-2 ring-ring ring-offset-2",
      className
    )}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Formatting toolbar */}
        {!compact && isFocused && (
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="flex items-center space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => insertText("**", "**")}
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => insertText("*", "*")}
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => insertText("`", "`")}
                title="Code"
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => insertText("@")}
                title="Mention someone"
              >
                <AtSign className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {characterCount}/{maxLength}
            </div>
          </div>
        )}

        {/* Textarea with mentions */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "min-h-[40px] max-h-[200px] border-0 focus-visible:ring-0 resize-none",
              compact && "min-h-[36px] max-h-[100px]",
              isOverLimit && "text-destructive"
            )}
            style={{ height: 'auto' }}
          />
          
          {/* Mention autocomplete */}
          {showMentions && (
            <div className="absolute bottom-full left-0 right-0 z-10 mb-1">
              <MentionAutocomplete
                query={mentionQuery}
                onSelect={handleMentionSelect}
                onClose={() => setShowMentions(false)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center space-x-2">
            {showAttachments && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={disabled}
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={disabled}
              title="Add emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {compact && (
              <span className={cn(
                "text-xs text-muted-foreground",
                isOverLimit && "text-destructive"
              )}>
                {characterCount}/{maxLength}
              </span>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!canSend}
              className="h-8"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}