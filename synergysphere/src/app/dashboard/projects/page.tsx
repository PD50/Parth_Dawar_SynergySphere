"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProjectList } from "@/components/projects/project-list";
import { ProjectForm } from "@/components/projects/project-form";
import { PageLoader } from "@/components/ui/page-loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProjectStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

interface Project {
  id: string;
  name: string;
  description: string;
  color?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  taskCount?: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Check if we should show the create dialog
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowCreateDialog(true);
      // Remove the query param
      router.replace('/dashboard/projects');
    }
  }, [searchParams, router]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/projects");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      
      const result = await response.json();
      setProjects(result.projects || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Manage your team projects and collaborations
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button onClick={fetchProjects} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your team projects and collaborations
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <ProjectList 
        projects={projects} 
        onRefresh={fetchProjects}
      />

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Set up a new project to start collaborating with your team.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            onSuccess={(project) => {
              setProjects(prev => [project, ...prev]);
              setShowCreateDialog(false);
              router.push(`/dashboard/projects/${project.id}`);
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}