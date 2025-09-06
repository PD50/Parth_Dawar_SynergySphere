"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  MoreHorizontal, 
  Reply, 
  Edit2, 
  Trash2, 
  Heart,
  MessageSquare,
  Clock,
  Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Message } from "@/types/messages";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  message: Message;
  currentUserId?: string;
  showReplyButton?: boolean;
  isReply?: boolean;
  className?: string;
  onReply?: (parentMessage: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onReaction?: (messageId: string, emoji: string) => void;
}

const formatMessageContent = (content: string): string => {
  // Handle @mentions with spaces (like "@John Smith")
  return content.replace(/@([\w\s]+?)(?=\s[a-z]|$)/g, '<span class="text-blue-600 font-medium bg-blue-50 px-1 rounded">@$1</span>');
};

export function MessageItem({
  message,
  currentUserId,
  showReplyButton = true,
  isReply = false,
  className,
  onReply,
  onEdit,
  onDelete,
  onReaction
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showReactions, setShowReactions] = useState(false);

  const isAuthor = currentUserId === message.authorId;
  const canEdit = isAuthor && !message.isEdited && !message.deletedAt;
  const canDelete = isAuthor || false; // TODO: Add admin permissions check

  const handleSaveEdit = () => {
    if (editContent.trim() !== message.content && onEdit) {
      onEdit({
        ...message,
        content: editContent.trim()
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleReaction = (emoji: string) => {
    if (onReaction) {
      onReaction(message.id, emoji);
    }
    setShowReactions(false);
  };

  const popularEmojis = ['👍', '❤️', '😊', '🎉', '👏', '🔥'];

  if (message.deletedAt) {
    return (
      <div className={cn(
        "flex w-full mb-4 px-4",
        isAuthor ? "justify-end" : "justify-start",
        isReply && "ml-12",
        className
      )}>
        <div className="flex max-w-[70%] opacity-60">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-muted-foreground italic">
              This message was deleted
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex w-full mb-4 px-4 group",
      isAuthor ? "justify-end" : "justify-start",
      isReply && "ml-12",
      className
    )}>
      <div className={cn(
        "flex max-w-[75%] min-w-[200px]",
        isAuthor ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.author.avatarUrl} alt={message.author.name} />
          <AvatarFallback className="text-xs">
            {message.author.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Message Content */}
        <div className={cn(
          "flex flex-col",
          isAuthor ? "mr-3 items-end" : "ml-3 items-start"
        )}>
          {/* Author and Time */}
          <div className={cn(
            "flex items-center gap-2 mb-1",
            isAuthor ? "flex-row-reverse" : "flex-row"
          )}>
            <span className="text-sm font-medium text-muted-foreground">
              {message.author.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </span>
            {message.isEdited && (
              <Badge variant="outline" className="text-xs">
                edited
              </Badge>
            )}
          </div>

          {/* Message Bubble */}
          <div className={cn(
            "relative rounded-2xl px-4 py-3 max-w-full break-words",
            isAuthor 
              ? "bg-primary text-primary-foreground rounded-br-md" 
              : "bg-muted text-muted-foreground rounded-bl-md",
            "shadow-sm"
          )}>
            {/* Message Actions Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "absolute -top-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                    isAuthor ? "-left-2" : "-right-2"
                  )}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isAuthor ? "start" : "end"}>
                {showReplyButton && onReply && (
                  <DropdownMenuItem onClick={() => onReply(message)}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setShowReactions(!showReactions)}>
                  <Heart className="h-4 w-4 mr-2" />
                  Add Reaction
                </DropdownMenuItem>
                {canEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  </>
                )}
                {canDelete && onDelete && (
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => onDelete(message)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Mode */}
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px] resize-none border-0 bg-transparent p-0 text-inherit placeholder:text-muted-foreground/60 focus-visible:ring-0"
                  placeholder="Edit your message..."
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* Normal Message Content */
              <div
                className="prose prose-sm max-w-none text-inherit"
                dangerouslySetInnerHTML={{
                  __html: formatMessageContent(message.content)
                }}
              />
            )}
          </div>

          {/* Reply Count */}
          {message.replyCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onReply && onReply(message)}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </Button>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions
                .reduce((acc: any[], reaction) => {
                  const existing = acc.find(r => r.emoji === reaction.emoji);
                  if (existing) {
                    existing.count += 1;
                    existing.users.push(reaction.userName);
                  } else {
                    acc.push({
                      emoji: reaction.emoji,
                      count: 1,
                      users: [reaction.userName]
                    });
                  }
                  return acc;
                }, [])
                .map((reaction) => (
                  <Badge
                    key={reaction.emoji}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-accent"
                    onClick={() => handleReaction(reaction.emoji)}
                  >
                    {reaction.emoji} {reaction.count}
                  </Badge>
                ))
              }
            </div>
          )}

          {/* Quick Reactions */}
          {showReactions && (
            <div className="flex gap-1 mt-2">
              {popularEmojis.map((emoji) => (
                <Button
                  key={emoji}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleReaction(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((attachment) => (
                <div key={attachment.id} className={cn(
                  "flex items-center space-x-2 p-3 rounded-lg border",
                  isAuthor ? "bg-primary/10" : "bg-muted"
                )}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}