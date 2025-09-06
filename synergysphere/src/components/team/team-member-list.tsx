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
  role: MemberRole;
  joinedAt: string;
  lastActive: string;
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
  const [inviteRole, setInviteRole] = useState<MemberRole>("MEMBER");
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = members.find(m => m.id === currentUserId);
  const canManageMembers = currentUser?.role === "OWNER" || currentUser?.role === "ADMIN";

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Email address is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to send invitation");
      }

      toast.success("Invitation sent successfully");
      setInviteEmail("");
      setInviteRole("MEMBER");
      setIsInviteDialogOpen(false);
      onMemberUpdate?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send invitation";
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
        description="Invite team members to start collaborating on projects"
        action={canManageMembers ? {
          label: "Invite Member",
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
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
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
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => {
          const RoleIcon = roleConfig[member.role].icon;
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
                <div className="space-y-2">
                  <Badge 
                    variant="secondary" 
                    className={roleConfig[member.role].className}
                  >
                    <RoleIcon className="mr-1 h-3 w-3" />
                    {roleConfig[member.role].label}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {roleConfig[member.role].description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}