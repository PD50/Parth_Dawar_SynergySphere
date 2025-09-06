"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageLoader } from "@/components/ui/page-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  ArrowRight,
  Calendar,
  User,
  Hash,
  Reply,
  Heart,
  RefreshCw
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  project: {
    id: string;
    name: string;
    color?: string;
  };
  parentMessage?: {
    id: string;
    content: string;
    author: {
      name: string;
    };
  };
  replyCount: number;
  reactions: Array<{
    id: string;
    emoji: string;
    user: {
      name: string;
    };
  }>;
}

interface Project {
  id: string;
  name: string;
  color?: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const router = useRouter();

  const fetchMessages = async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const params = new URLSearchParams();
      params.append('limit', '20');
      
      if (!reset && nextCursor) {
        params.append('cursor', nextCursor);
      }
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (selectedProjectId && selectedProjectId !== 'all') {
        params.append('projectId', selectedProjectId);
      }

      const response = await fetch(`/api/messages?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (reset) {
        setMessages(data.messages || []);
        setProjects(data.projects || []);
      } else {
        setMessages(prev => [...prev, ...(data.messages || [])]);
      }
      
      setHasMore(data.hasMore || false);
      setNextCursor(data.nextCursor);

    } catch (err) {
      console.error('Failed to fetch messages:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
  }, [searchQuery, selectedProjectId]);

  const handleMessageClick = (message: Message) => {
    // Navigate to the project's messages page
    router.push(`/dashboard/projects/${message.project.id}/messages`);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      fetchMessages(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading messages..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">View messages from all your projects</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-destructive mb-2">Error loading messages</div>
              <div className="text-sm text-muted-foreground">{error}</div>
              <Button 
                onClick={() => fetchMessages(true)} 
                className="mt-4"
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">View messages from all your projects</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Project Filter */}
            <div className="w-full sm:w-64">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color || '#3b82f6' }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      {messages.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title="No messages found"
          description={
            searchQuery || selectedProjectId !== 'all'
              ? "Try adjusting your filters to see more messages"
              : "Messages will appear here when you start conversations in your projects"
          }
        />
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card 
              key={message.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleMessageClick(message)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {/* Author Avatar */}
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={message.author.avatarUrl} alt={message.author.name} />
                    <AvatarFallback className="text-xs">
                      {message.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    {/* Message Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{message.author.name}</span>
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{ 
                          backgroundColor: `${message.project.color || '#3b82f6'}20`,
                          borderColor: message.project.color || '#3b82f6'
                        }}
                      >
                        <Hash className="mr-1 h-3 w-3" />
                        {message.project.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        <Calendar className="inline mr-1 h-3 w-3" />
                        {formatDate(message.createdAt)}
                      </span>
                    </div>

                    {/* Parent Message (if reply) */}
                    {message.parentMessage && (
                      <div className="bg-muted/30 rounded p-2 mb-2 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Reply className="h-3 w-3" />
                          <span>Replying to {message.parentMessage.author.name}</span>
                        </div>
                        <div className="truncate">
                          {message.parentMessage.content.substring(0, 100)}
                          {message.parentMessage.content.length > 100 && '...'}
                        </div>
                      </div>
                    )}

                    {/* Message Content */}
                    <div className="text-sm mb-2">
                      {message.content.substring(0, 200)}
                      {message.content.length > 200 && (
                        <span className="text-muted-foreground">... </span>
                      )}
                    </div>

                    {/* Message Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {message.replyCount > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {message.replyCount} replies
                        </div>
                      )}
                      {message.reactions.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {message.reactions.length} reactions
                        </div>
                      )}
                      <div className="flex items-center gap-1 ml-auto">
                        <span>View in project</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button 
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                variant="outline"
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Messages
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}