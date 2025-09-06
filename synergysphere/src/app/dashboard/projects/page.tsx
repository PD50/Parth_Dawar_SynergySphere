"use client";

import { useState, useEffect } from "react";
import { ProjectList } from "@/components/projects/project-list";
import { PageLoader } from "@/components/ui/page-loader";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Mock data for demonstration
const mockProjects = [
  {
    id: "1",
    name: "SynergySphere MVP",
    description: "Building the core team collaboration platform with AI-powered insights and seamless project management.",
    status: "ACTIVE" as const,
    color: "#3b82f6",
    memberCount: 5,
    taskCount: 23,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T15:30:00Z",
  },
  {
    id: "2", 
    name: "Marketing Website",
    description: "Design and develop the marketing website to showcase our platform features and attract new users.",
    status: "ACTIVE" as const,
    color: "#10b981",
    memberCount: 3,
    taskCount: 12,
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-18T11:20:00Z",
  },
  {
    id: "3",
    name: "Mobile App",
    description: "React Native mobile application for iOS and Android platforms.",
    status: "COMPLETED" as const,
    color: "#8b5cf6",
    memberCount: 4,
    taskCount: 28,
    createdAt: "2023-12-01T08:00:00Z",
    updatedAt: "2024-01-05T16:45:00Z",
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API call - in real app this would be:
      // const response = await fetch("/api/projects");
      // const result = await response.json();
      
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      setProjects(mockProjects);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch projects";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (isLoading) {
    return <PageLoader message="Loading projects..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your team projects and collaborate effectively
          </p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return <ProjectList projects={projects} onProjectUpdate={fetchProjects} />;
}