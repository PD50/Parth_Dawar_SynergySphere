"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MessageFeed } from "@/components/messages/MessageFeed";
import { PageLoader } from "@/components/ui/page-loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, Clock, TrendingUp } from "lucide-react";
import { useMessageStore } from "@/stores/messageStore";
import { useSocket } from "@/hooks/useSocket";



export default function ProjectMessagesPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [messageStats, setMessageStats] = useState({ total: 0, replies: 0, today: 0 });

  const {
    setMessages,
    addMessage,
    updateMessage,
    removeMessage,
    handleRealTimeMessage,
    handleRealTimeMessageUpdate,
    handleRealTimeMessageDelete
  } = useMessageStore();

  // Setup WebSocket connection for real-time updates
  const {
    emitTaskUpdate,
    emitTaskCreate,
    emitTaskDelete,
    emitTaskMove
  } = useSocket({
    projectId,
    onTaskUpdate: (task) => {
      // Handle task-related real-time updates if needed
      console.log('Task updated:', task);
    },
    onTaskCreate: (task) => {
      console.log('Task created:', task);
    },
    onTaskDelete: (taskId) => {
      console.log('Task deleted:', taskId);
    },
    onTaskMove: (taskId, newStatus) => {
      console.log('Task moved:', taskId, newStatus);
    }
  });

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch current user data first
        const authResponse = await fetch('/api/auth/me');
        if (authResponse.ok) {
          const authData = await authResponse.json();
          setCurrentUserId(authData.user?.id);
        }

        // Fetch project data
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) {
          throw new Error(`Failed to load project: ${projectResponse.statusText}`);
        }
        const projectData = await projectResponse.json();
        setProject(projectData);

        // Fetch messages for this project
        const messagesResponse = await fetch(`/api/projects/${projectId}/messages?limit=50`);
        if (!messagesResponse.ok) {
          throw new Error(`Failed to load messages: ${messagesResponse.statusText}`);
        }
        const messagesData = await messagesResponse.json();
        setMessages(messagesData.messages || []);

        // Calculate stats
        const messages = messagesData.messages || [];
        const rootMessages = messages.filter((m: any) => !m.parentId);
        const replies = messages.filter((m: any) => m.parentId);
        const today = new Date().toDateString();
        const todayMessages = messages.filter((m: any) => 
          new Date(m.createdAt).toDateString() === today
        );

        setMessageStats({
          total: rootMessages.length,
          replies: replies.length,
          today: todayMessages.length
        });
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load project data";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectData();
  }, [projectId, setMessages]);

  if (isLoading) {
    return <PageLoader message="Loading project messages..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
            style={{ backgroundColor: project.color }}
          >
            {project?.name?.charAt(0)?.toUpperCase() || 'P'}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground mt-1">{project.description}</p>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{project.memberCount} members</span>
              </Badge>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <MessageSquare className="h-3 w-3" />
                <span>Discussion</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {messageStats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {messageStats.replies} replies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {messageStats.today}
            </div>
            <p className="text-xs text-muted-foreground">
              messages today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h</div>
            <p className="text-xs text-muted-foreground">
              ago
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Message Feed */}
      <Card className="h-[600px] flex flex-col">
        <MessageFeed 
          projectId={projectId}
          currentUserId={currentUserId}
          className="flex-1"
        />
      </Card>
    </div>
  );
}