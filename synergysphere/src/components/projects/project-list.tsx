"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProjectForm } from "./project-form";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  Plus,
  FolderOpen,
  Archive
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type ProjectStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  color?: string;
  memberCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectListProps {
  projects: Project[];
  onProjectUpdate?: () => void;
}

const statusConfig = {
  ACTIVE: { label: "Active", className: "bg-green-100 text-green-800" },
  COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-800" },
  ARCHIVED: { label: "Archived", className: "bg-gray-100 text-gray-800" },
};

export function ProjectList({ projects, onProjectUpdate }: ProjectListProps) {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleDelete = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete project");
      }

      toast.success("Project deleted successfully");
      onProjectUpdate?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete project";
      toast.error(errorMessage);
    }
  };

  const handleArchive = async (project: Project) => {
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...project,
          status: "ARCHIVED",
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to archive project");
      }

      toast.success("Project archived successfully");
      onProjectUpdate?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to archive project";
      toast.error(errorMessage);
    }
  };

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderOpen className="h-12 w-12" />}
        title="No projects yet"
        description="Create your first project to get started with team collaboration"
        action={{
          label: "Create Project",
          onClick: () => setIsCreateDialogOpen(true),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground">
            Manage your team projects and collaborate effectively
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <ProjectForm
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                onProjectUpdate?.();
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color || "#3b82f6" }}
                    />
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={statusConfig[project.status].className}
                  >
                    {statusConfig[project.status].label}
                  </Badge>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingProject(project)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {project.status !== "ARCHIVED" && (
                      <DropdownMenuItem onClick={() => handleArchive(project)}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleDelete(project)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <CardDescription className="line-clamp-2">
                {project.description || "No description provided"}
              </CardDescription>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    {project.memberCount}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {project.taskCount} tasks
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <Link href={`/dashboard/projects/${project.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Project
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog 
        open={!!editingProject} 
        onOpenChange={(open) => !open && setEditingProject(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogTitle>Edit Project</DialogTitle>
          {editingProject && (
            <ProjectForm
              initialData={editingProject}
              isEdit
              onSuccess={() => {
                setEditingProject(null);
                onProjectUpdate?.();
              }}
              onCancel={() => setEditingProject(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}