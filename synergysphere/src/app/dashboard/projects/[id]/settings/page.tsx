"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Users, 
  Shield, 
  Palette,
  Save,
  AlertTriangle,
  Trash2,
  Plus,
  X,
  Crown,
  UserCog
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  ownerId: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // Project settings
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    status: "ACTIVE" as const,
  });

  useEffect(() => {
    fetchProject();
    fetchMembers();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
        setProjectData({
          name: data.name,
          description: data.description || "",
          color: data.color || "#3b82f6",
          status: data.status,
        });
      }
    } catch (error) {
      console.error("Failed to fetch project:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${id}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  };

  const handleProjectSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Project settings updated successfully!' });
        fetchProject();
      } else {
        setMessage({ type: 'error', text: 'Failed to update project settings.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating project settings.' });
    }
    setLoading(false);
    
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInviteMember = async () => {
    if (!newMemberEmail.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newMemberEmail.trim(),
          role: 'MEMBER'
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Member invited successfully!' });
        setNewMemberEmail("");
        fetchMembers();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to invite member.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while inviting member.' });
    }
    setLoading(false);
    
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Member removed successfully!' });
        fetchMembers();
      } else {
        setMessage({ type: 'error', text: 'Failed to remove member.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while removing member.' });
    }
    setLoading(false);
    
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Member role updated successfully!' });
        fetchMembers();
      } else {
        setMessage({ type: 'error', text: 'Failed to update member role.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating member role.' });
    }
    setLoading(false);
    
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteProject = async () => {
    const confirmMessage = `This action cannot be undone. This will permanently delete the project "${project?.name}" and all of its data. Please type the project name to confirm.`;
    const userInput = prompt(confirmMessage);
    
    if (userInput !== project?.name) {
      setMessage({ type: 'error', text: 'Project name does not match.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/projects');
      } else {
        setMessage({ type: 'error', text: 'Failed to delete project.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while deleting project.' });
    }
    setLoading(false);
    
    setTimeout(() => setMessage(null), 3000);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-3 w-3" />;
      case 'ADMIN':
        return <UserCog className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-yellow-100 text-yellow-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: project.color }}
        >
          {project.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{project.name} Settings</h1>
          <p className="text-muted-foreground">Manage your project configuration and team</p>
        </div>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-destructive' : 'border-green-500'}`} variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Update your project information and appearance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={projectData.name}
                    onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Project Color</Label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border cursor-pointer"
                      style={{ backgroundColor: projectData.color }}
                      onClick={() => document.getElementById('color-picker')?.click()}
                    />
                    <Input
                      id="color-picker"
                      type="color"
                      value={projectData.color}
                      onChange={(e) => setProjectData({ ...projectData, color: e.target.value })}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">{projectData.color}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={projectData.description}
                  onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Project Status</Label>
                <select
                  id="status"
                  value={projectData.status}
                  onChange={(e) => setProjectData({ ...projectData, status: e.target.value as any })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <Button onClick={handleProjectSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage who has access to this project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address to invite"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInviteMember()}
                />
                <Button onClick={handleInviteMember} disabled={loading || !newMemberEmail.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Current Members ({members.length})</h4>
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                        <AvatarFallback className="text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className={getRoleColor(member.role)}>
                        {getRoleIcon(member.role)}
                        <span className="ml-1">{member.role}</span>
                      </Badge>
                      
                      {member.role !== 'OWNER' && (
                        <div className="flex gap-1">
                          {member.role === 'MEMBER' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateMemberRole(member.id, 'ADMIN')}
                              disabled={loading}
                            >
                              Make Admin
                            </Button>
                          )}
                          {member.role === 'ADMIN' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateMemberRole(member.id, 'MEMBER')}
                              disabled={loading}
                            >
                              Remove Admin
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={loading}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Warning: These actions cannot be undone. Please be certain before proceeding.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Delete Project</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete this project and all of its data including tasks, discussions, and files.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteProject}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}