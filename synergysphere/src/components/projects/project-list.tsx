"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProjectForm } from "./project-form";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users, 
  FolderOpen,
  Archive,
  CheckSquare,
  Tag
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  manager?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  tags?: {
    category: string;
    type: string;
    color?: string;
  }[];
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
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color || "#3b82f6" }}
                    />
                    <CardTitle className="text-base sm:text-lg truncate">{project.name}</CardTitle>
                  </div>
                  
                  {/* Manager Avatar */}
                  {project.manager && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={project.manager.avatarUrl} alt={project.manager.name} />
                        <AvatarFallback className="text-xs">
                          {project.manager.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate">
                        Manager: {project.manager.name}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge 
                      variant="secondary" 
                      className={`${statusConfig[project.status].className} text-xs`}
                    >
                      {statusConfig[project.status].label}
                    </Badge>
                    
                    {/* Project Tags */}
                    {project.tags && project.tags.map((tag, index) => (
                      <Badge 
                        key={index}
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: tag.color, color: tag.color }}
                      >
                        <Tag className="h-2 w-2 mr-1" />
                        {tag.category}/{tag.type}
                      </Badge>
                    ))}
                  </div>
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
            
            <CardContent className="space-y-3 sm:space-y-4">
              <CardDescription className="line-clamp-2 text-sm">
                {project.description || "No description provided"}
              </CardDescription>
              
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate">{project.memberCount} members</span>
                </div>
                <div className="flex items-center">
                  <CheckSquare className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate">{project.taskCount} tasks</span>
                </div>
              </div>
              
              <div className="pt-2">
                <Link href={`/dashboard/projects/${project.id}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
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