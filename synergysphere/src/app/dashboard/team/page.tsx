"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { TeamMemberList } from "@/components/team/team-member-list";
import { PageLoader } from "@/components/ui/page-loader";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Mock data for demonstration
const mockTeamMembers = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@synergysphere.com",
    avatarUrl: "",
    role: "OWNER" as const,
    joinedAt: "2024-01-01T00:00:00Z",
    lastActive: "2024-01-20T15:30:00Z",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@synergysphere.com",
    avatarUrl: "",
    role: "ADMIN" as const,
    joinedAt: "2024-01-05T00:00:00Z",
    lastActive: "2024-01-20T14:20:00Z",
  },
  {
    id: "3",
    name: "Carol Davis",
    email: "carol@synergysphere.com",
    avatarUrl: "",
    role: "MEMBER" as const,
    joinedAt: "2024-01-10T00:00:00Z",
    lastActive: "2024-01-20T13:45:00Z",
  },
  {
    id: "4",
    name: "David Wilson",
    email: "david@synergysphere.com",
    avatarUrl: "",
    role: "MEMBER" as const,
    joinedAt: "2024-01-15T00:00:00Z",
    lastActive: "2024-01-20T16:00:00Z",
  },
];

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API call - in real app this would be:
      // const response = await fetch("/api/team/members");
      // const result = await response.json();
      
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate loading
      setMembers(mockTeamMembers);
    } catch (err) {
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