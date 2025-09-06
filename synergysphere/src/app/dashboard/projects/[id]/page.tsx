"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ProjectOverview } from "@/components/projects/project-overview";
import { PageLoader } from "@/components/ui/page-loader";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Mock data for demonstration
const mockProjectData = {
  "1": {
    project: {
      id: "1",
      name: "SynergySphere MVP",
      description: "Building the core team collaboration platform with AI-powered insights and seamless project management tools for modern teams.",
      status: "ACTIVE" as const,
      color: "#3b82f6",
      progress: 65,
      totalTasks: 24,
      completedTasks: 16,
      totalMembers: 5,
      deadline: "2024-02-15T00:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
    },
    members: [
      {
        id: "1",
        name: "Alice Johnson",
        email: "alice@synergysphere.com",
        avatarUrl: "",
        role: "OWNER" as const,
      },
      {
        id: "2",
        name: "Bob Smith",
        email: "bob@synergysphere.com",
        avatarUrl: "",
        role: "ADMIN" as const,
      },
      {
        id: "3",
        name: "Carol Davis",
        email: "carol@synergysphere.com",
        avatarUrl: "",
        role: "MEMBER" as const,
      },
      {
        id: "4",
        name: "David Wilson",
        email: "david@synergysphere.com",
        avatarUrl: "",
        role: "MEMBER" as const,
      },
      {
        id: "5",
        name: "Eve Martinez",
        email: "eve@synergysphere.com",
        avatarUrl: "",
        role: "MEMBER" as const,
      },
    ],
    recentActivity: [
      {
        id: "1",
        type: "task_completed" as const,
        message: "Completed task: Implement user authentication system",
        user: { name: "Bob Smith", avatarUrl: "" },
        timestamp: "2024-01-20T14:30:00Z",
      },
      {
        id: "2",
        type: "member_added" as const,
        message: "Added Eve Martinez to the project",
        user: { name: "Alice Johnson", avatarUrl: "" },
        timestamp: "2024-01-20T10:15:00Z",
      },
      {
        id: "3",
        type: "comment_added" as const,
        message: "Added comment on 'Database Schema Design'",
        user: { name: "Carol Davis", avatarUrl: "" },
        timestamp: "2024-01-19T16:45:00Z",
      },
      {
        id: "4",
        type: "deadline_updated" as const,
        message: "Updated project deadline to February 15, 2024",
        user: { name: "Alice Johnson", avatarUrl: "" },
        timestamp: "2024-01-19T09:20:00Z",
      },
    ],
  },
  "2": {
    project: {
      id: "2",
      name: "Marketing Website",
      description: "Design and develop the marketing website to showcase our platform features and attract new users with compelling content.",
      status: "ACTIVE" as const,
      color: "#10b981",
      progress: 40,
      totalTasks: 15,
      completedTasks: 6,
      totalMembers: 3,
      deadline: "2024-01-30T00:00:00Z",
      createdAt: "2024-01-10T00:00:00Z",
    },
    members: [
      {
        id: "1",
        name: "Alice Johnson",
        email: "alice@synergysphere.com",
        avatarUrl: "",
        role: "OWNER" as const,
      },
      {
        id: "6",
        name: "Frank Brown",
        email: "frank@synergysphere.com",
        avatarUrl: "",
        role: "ADMIN" as const,
      },
      {
        id: "7",
        name: "Grace Lee",
        email: "grace@synergysphere.com",
        avatarUrl: "",
        role: "MEMBER" as const,
      },
    ],
    recentActivity: [
      {
        id: "5",
        type: "task_completed" as const,
        message: "Completed task: Homepage design mockups",
        user: { name: "Grace Lee", avatarUrl: "" },
        timestamp: "2024-01-20T12:00:00Z",
      },
      {
        id: "6",
        type: "comment_added" as const,
        message: "Added feedback on landing page copy",
        user: { name: "Frank Brown", avatarUrl: "" },
        timestamp: "2024-01-19T14:30:00Z",
      },
    ],
  },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API call - in real app this would be:
      // const response = await fetch(`/api/projects/${projectId}`);
      // const result = await response.json();
      
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      
      const projectData = mockProjectData[projectId as keyof typeof mockProjectData];
      if (!projectData) {
        throw new Error("Project not found");
      }
      
      setData(projectData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch project data";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  if (isLoading) {
    return <PageLoader message="Loading project details..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <ProjectOverview
      project={data.project}
      members={data.members}
      recentActivity={data.recentActivity}
      onEdit={() => {
        // Handle edit functionality
        console.log("Edit project:", data.project.id);
      }}
    />
  );
}