"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  // Simple @mention highlighting - replace with more sophisticated parsing
  return content.replace(/@(\w+)/g, '<span class="text-blue-600 font-medium bg-blue-50 px-1 rounded">@$1</span>');
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
        "flex items-start space-x-3 py-2 opacity-60",
        isReply && "ml-8",
        className
      )}>
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground italic">
            This message was deleted
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "border-0 shadow-none bg-transparent",
      isReply && "ml-8 border-l-2 border-muted pl-4 bg-muted/20",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.author.avatarUrl} alt={message.author.name} />
            <AvatarFallback className="text-xs">
              {message.author.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">{message.author.name}</span>
                <span className="text-xs text-muted-foreground">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </span>
                {message.isEdited && (
                  <Badge variant="secondary" className="text-xs">
                    <Edit2 className="h-3 w-3 mr-1" />
                    edited
                  </Badge>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
            </div>

            {/* Content */}
            <div className="mt-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px] resize-none"
                    placeholder="Edit your message..."
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2">
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessageContent(message.content) 
                  }}
                />
              )}
            </div>

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {message.reactions.reduce((acc, reaction) => {
                  const existing = acc.find(r => r.emoji === reaction.emoji);
                  if (existing) {
                    existing.count++;
                    existing.users.push(reaction.userName);
                  } else {
                    acc.push({
                      emoji: reaction.emoji,
                      count: 1,
                      users: [reaction.userName]
                    });
                  }
                  return acc;
                }, [] as Array<{ emoji: string; count: number; users: string[] }>)
                .map(({ emoji, count, users }) => (
                  <Badge 
                    key={emoji}
                    variant="secondary" 
                    className="cursor-pointer hover:bg-secondary/80 px-2 py-1"
                    onClick={() => handleReaction(emoji)}
                    title={`${users.join(', ')} reacted with ${emoji}`}
                  >
                    {emoji} {count}
                  </Badge>
                ))}
              </div>
            )}

            {/* Emoji Picker */}
            {showReactions && (
              <div className="flex gap-2 mt-2 p-2 bg-muted rounded-md">
                {popularEmojis.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-background"
                    onClick={() => handleReaction(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            )}

            {/* Reply count indicator */}
            {message.replyCount > 0 && !isReply && showReplyButton && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-muted-foreground hover:text-foreground"
                onClick={() => onReply && onReply(message)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
              </Button>
            )}

            {/* Mentions */}
            {message.mentions.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {message.mentionedUsers?.map((user) => (
                    <Badge key={user.id} variant="outline" className="text-xs">
                      @{user.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-muted rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{attachment.fileName}</p>
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
      </CardContent>
    </Card>
  );
}