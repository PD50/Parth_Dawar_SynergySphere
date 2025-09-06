"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ProjectOverview } from "@/components/projects/project-overview";
import { PageLoader } from "@/components/ui/page-loader";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

      const response = await fetch(`/api/projects/${projectId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Project not found");
        }
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }
      
      const projectData = await response.json();
      setData(projectData);
    } catch (err) {
      console.error('Failed to fetch project data:', err);
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