"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  MoreHorizontal, 
  UserPlus, 
  Mail, 
  Shield, 
  ShieldCheck,
  Crown,
  Users,
  Trash2,
  Edit
} from "lucide-react";
import { toast } from "sonner";

type MemberRole = "OWNER" | "ADMIN" | "MEMBER";

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

interface TeamMemberListProps {
  members: TeamMember[];
  currentUserId?: string;
  onMemberUpdate?: () => void;
}

const roleConfig = {
  OWNER: { 
    label: "Owner", 
    icon: Crown, 
    className: "bg-yellow-100 text-yellow-800",
    description: "Full access to all project settings"
  },
  ADMIN: { 
    label: "Admin", 
    icon: ShieldCheck, 
    className: "bg-purple-100 text-purple-800",
    description: "Can manage members and project settings"
  },
  MEMBER: { 
    label: "Member", 
    icon: Shield, 
    className: "bg-blue-100 text-blue-800",
    description: "Can contribute to project tasks"
  },
};

export function TeamMemberList({ 
  members, 
  currentUserId, 
  onMemberUpdate 
}: TeamMemberListProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("MEMBER");
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = members.find(m => m.id === currentUserId);
  const canManageMembers = currentUser?.role === "OWNER" || currentUser?.role === "ADMIN";

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !inviteName.trim()) {
      toast.error("Email and name are required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/team/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to add team member");
      }

      const result = await response.json();
      
      // Show success message with credentials if provided
      if (result.tempCredentials) {
        toast.success(
          `✅ ${result.message}\n🔑 Email: ${result.tempCredentials.email}\n🔐 Password: ${result.tempCredentials.tempPassword}\n🌐 Login at: ${result.tempCredentials.loginUrl}`,
          { duration: 10000 }
        );
      } else if (result.tempPassword) {
        toast.success(`Team member added! Temp password: ${result.tempPassword}`);
      } else {
        toast.success(result.message || "Team member added successfully");
      }
      
      setInviteEmail("");
      setInviteName("");
      setInviteRole("MEMBER");
      setIsInviteDialogOpen(false);
      onMemberUpdate?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add team member";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: MemberRole) => {
    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to update member role");
      }

      toast.success("Member role updated successfully");
      onMemberUpdate?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update member role";
      toast.error(errorMessage);
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/team/members/${member.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to remove member");
      }

      toast.success("Member removed successfully");
      onMemberUpdate?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove member";
      toast.error(errorMessage);
    }
  };

  if (members.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="No team members yet"
        description="Add team members to start collaborating on projects. They'll be able to access projects you assign them to."
        action={canManageMembers ? {
          label: "Add Member",
          onClick: () => setIsInviteDialogOpen(true),
        } : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-muted-foreground">
            Manage your team and collaborate effectively
          </p>
        </div>
        
        {canManageMembers && (
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Smith"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(value: MemberRole) => setInviteRole(value)}>
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
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteMember} disabled={isLoading}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => {
          const memberRole = member.role as keyof typeof roleConfig || 'MEMBER';
          const roleInfo = roleConfig[memberRole] || roleConfig.MEMBER;
          const RoleIcon = roleInfo.icon;
          const canModify = canManageMembers && member.id !== currentUserId && member.role !== "OWNER";
          
          return (
            <Card key={member.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                      <AvatarFallback>
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{member.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  
                  {canModify && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "ADMIN")}>
                          <Edit className="mr-2 h-4 w-4" />
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "MEMBER")}>
                          <Edit className="mr-2 h-4 w-4" />
                          Make Member
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleRemoveMember(member)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="secondary" 
                      className={roleInfo.className}
                    >
                      <RoleIcon className="mr-1 h-3 w-3" />
                      {roleInfo.label}
                    </Badge>
                    {member.projectCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {member.projectCount} project{member.projectCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {roleInfo.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                  {member.projects && member.projects.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Projects:</p>
                      <div className="space-y-1">
                        {member.projects.slice(0, 2).map((project) => (
                          <div key={project.id} className="flex justify-between text-xs">
                            <span className="truncate">{project.name}</span>
                            <span className="text-muted-foreground ml-2">{project.role.toLowerCase()}</span>
                          </div>
                        ))}
                        {member.projects.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{member.projects.length - 2} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}