"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  UserPlus, 
  Users,
  Crown,
  Shield,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  joinedAt: string;
}

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  joinedAt: string;
}

interface ProjectMemberManagerProps {
  projectId: string;
  canManage?: boolean;
}

const roleConfig = {
  OWNER: { 
    label: "Owner", 
    icon: Crown, 
    className: "bg-yellow-100 text-yellow-800",
  },
  ADMIN: { 
    label: "Admin", 
    icon: ShieldCheck, 
    className: "bg-purple-100 text-purple-800",
  },
  MEMBER: { 
    label: "Member", 
    icon: Shield, 
    className: "bg-blue-100 text-blue-800",
  },
};

export function ProjectMemberManager({ projectId, canManage = false }: ProjectMemberManagerProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("MEMBER");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`);
      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.statusText}`);
      }
      const result = await response.json();
      setMembers(result.members || []);
    } catch (err) {
      console.error('Failed to fetch project members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(`/api/team/available?excludeProject=${projectId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch available users: ${response.statusText}`);
      }
      const result = await response.json();
      setAvailableUsers(result.users || []);
    } catch (err) {
      console.error('Failed to fetch available users:', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchMembers(),
        canManage ? fetchAvailableUsers() : Promise.resolve()
      ]);
    } catch (err) {
      // Error handling is done in individual functions
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId, canManage]);

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to add member');
      }

      toast.success("Member added to project successfully");
      setSelectedUserId("");
      setSelectedRole("MEMBER");
      setIsAddDialogOpen(false);
      
      // Refresh data
      await loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add member";
      toast.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this project?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to remove member');
      }

      toast.success("Member removed from project");
      await fetchMembers(); // Refresh members list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove member";
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading members...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive text-center py-8">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Project Members ({members.length})</CardTitle>
          {canManage && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Member to Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select User</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a team member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                <AvatarFallback className="text-xs">
                                  {user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMember} disabled={isAdding}>
                      {isAdding ? "Adding..." : "Add Member"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No members yet"
            description="Add team members to collaborate on this project"
          />
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const memberRole = member.role as keyof typeof roleConfig || 'MEMBER';
              const roleInfo = roleConfig[memberRole] || roleConfig.MEMBER;
              const RoleIcon = roleInfo.icon;
              const canRemove = canManage && member.role !== 'OWNER';

              return (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                      <AvatarFallback>
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant="secondary" className={roleInfo.className}>
                      <RoleIcon className="mr-1 h-3 w-3" />
                      {roleInfo.label}
                    </Badge>
                  </div>
                  {canRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}