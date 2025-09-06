"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";

export type ProjectFormData = {
  name: string;
  description: string;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  color?: string;
};

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  onSuccess?: (project: any) => void;
  onCancel?: () => void;
  isEdit?: boolean;
}

export function ProjectForm({ 
  initialData, 
  onSuccess, 
  onCancel, 
  isEdit = false 
}: ProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    status: initialData?.status || "ACTIVE",
    color: initialData?.color || "#3b82f6",
  });

  const handleChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Project name is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = isEdit ? `/api/projects/${initialData?.id}` : "/api/projects";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEdit ? 'update' : 'create'} project`);
      }

      toast.success(`Project ${isEdit ? 'updated' : 'created'} successfully`);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} project`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEdit ? "Edit Project" : "Create New Project"}
        </CardTitle>
        <CardDescription>
          {isEdit 
            ? "Update your project details" 
            : "Set up a new project for your team"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter project name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your project..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Project Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: ProjectFormData["status"]) => 
                handleChange("status", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project Color */}
          <div className="space-y-2">
            <Label htmlFor="color">Project Color</Label>
            <div className="flex items-center space-x-3">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => handleChange("color", e.target.value)}
                disabled={isLoading}
                className="w-16 h-10 p-1 rounded border"
              />
              <Input
                type="text"
                placeholder="#3b82f6"
                value={formData.color}
                onChange={(e) => handleChange("color", e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {isEdit ? (
                    <Save className="mr-2 h-4 w-4" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {isEdit ? "Update Project" : "Create Project"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}