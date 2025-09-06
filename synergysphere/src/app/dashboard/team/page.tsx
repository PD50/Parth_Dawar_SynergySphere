"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { TeamMemberList } from "@/components/team/team-member-list";
import { PageLoader } from "@/components/ui/page-loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  joinedAt: string;
  lastActive: string;
  projectCount: number;
  projects: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/team/members");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team members: ${response.statusText}`);
      }
      
      const result = await response.json();
      setMembers(result.members || []);
    } catch (err) {
      console.error('Failed to fetch team members:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch team members";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  if (isLoading) {
    return <PageLoader message="Loading team members..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your team and collaborate effectively
          </p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={fetchTeamMembers} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TeamMemberList 
      members={members} 
      currentUserId={user?.id}
      onMemberUpdate={fetchTeamMembers}
    />
  );
}