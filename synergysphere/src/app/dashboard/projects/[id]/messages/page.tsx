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

// Mock project data
const mockProjectData = {
  "1": {
    name: "SynergySphere MVP",
    description: "Building the core team collaboration platform",
    memberCount: 5,
    color: "#3b82f6"
  },
  "2": {
    name: "Marketing Website", 
    description: "Design and develop the marketing website",
    memberCount: 3,
    color: "#10b981"
  }
};

// Mock messages data
const mockMessages = [
  {
    id: '1',
    content: 'Hey team! Just wanted to update everyone on the current sprint progress. We\'re making great progress on the authentication system and I think we\'ll be able to wrap up the user management features by end of week. @bob @carol what do you think about the current API structure?',
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
    content: 'Thanks for the update @alice! The login flow is working smoothly on my end. I think the API structure looks solid. Should we schedule a review session for the endpoints we\'ve built so far?',
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
  },
  {
    id: '3',
    content: 'Agreed! The authentication system is looking great. I\'ve been working on the database schema and I think we should align on the user roles structure. Would tomorrow afternoon work for everyone?',
    authorId: '3',
    projectId: '1',
    parentId: '1',
    threadId: '1',
    mentions: [],
    attachments: [],
    reactions: [
      { id: '3', emoji: '✅', userId: '1', userName: 'Alice Johnson', createdAt: new Date('2024-01-25T09:25:00Z') }
    ],
    createdAt: new Date('2024-01-25T09:20:00Z'),
    updatedAt: new Date('2024-01-25T09:20:00Z'),
    author: {
      id: '3',
      name: 'Carol Davis',
      email: 'carol@synergysphere.com',
      avatarUrl: ''
    },
    replies: [],
    mentionedUsers: [],
    isEdited: false,
    replyCount: 0
  }
];

export default function ProjectMessagesPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId] = useState('1'); // Mock current user

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

        // Simulate API call for project data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const projectData = mockProjectData[projectId as keyof typeof mockProjectData];
        if (!projectData) {
          throw new Error("Project not found");
        }
        
        setProject(projectData);

        // Load messages for this project
        const projectMessages = mockMessages.filter(msg => msg.projectId === projectId);
        setMessages(projectMessages);
        
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
            {project.name.charAt(0).toUpperCase()}
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
              {mockMessages.filter(m => m.projectId === projectId && !m.parentId).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockMessages.filter(m => m.projectId === projectId && m.parentId).length} replies
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
              {mockMessages.filter(m => {
                const today = new Date().toDateString();
                return m.projectId === projectId && new Date(m.createdAt).toDateString() === today;
              }).length}
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