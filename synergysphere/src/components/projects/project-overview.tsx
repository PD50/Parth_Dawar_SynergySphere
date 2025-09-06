"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ProjectMemberManager } from "@/components/projects/project-member-manager";
import Link from "next/link";
import { 
  Calendar, 
  Users, 
  CheckSquare, 
  Clock,
  AlertCircle,
  TrendingUp,
  Settings,
  Edit,
  MessageSquare
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  color?: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  totalMembers: number;
  deadline?: string;
  createdAt: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
}

interface RecentActivity {
  id: string;
  type: "task_completed" | "member_added" | "deadline_updated" | "comment_added";
  message: string;
  user: {
    name: string;
    avatarUrl?: string;
  };
  timestamp: string;
}

interface ProjectOverviewProps {
  project: Project;
  members: TeamMember[];
  recentActivity: RecentActivity[];
  onEdit?: () => void;
  currentUserRole?: string;
}

const statusConfig = {
  ACTIVE: { label: "Active", className: "bg-green-100 text-green-800" },
  COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-800" },
  ARCHIVED: { label: "Archived", className: "bg-gray-100 text-gray-800" },
};

export function ProjectOverview({
  project,
  members,
  recentActivity,
  onEdit,
  currentUserRole
}: ProjectOverviewProps) {
  const completionRate = Math.round((project.completedTasks / project.totalTasks) * 100) || 0;
  const daysUntilDeadline = project.deadline 
    ? Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  const canManageMembers = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-0">
        <div className="flex items-center space-x-3 sm:space-x-4 w-full">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0"
            style={{ backgroundColor: project.color || "#3b82f6" }}
          >
            {project?.name?.charAt(0)?.toUpperCase() || 'P'}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-bold truncate">{project.name}</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base line-clamp-2">{project.description}</p>
            <div className="flex items-center space-x-2 mt-2 flex-wrap gap-1">
              <Badge 
                variant="secondary" 
                className={`${statusConfig[project.status].className} text-xs`}
              >
                {statusConfig[project.status].label}
              </Badge>
              {daysUntilDeadline !== null && (
                <Badge 
                  variant={daysUntilDeadline < 7 ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  <Clock className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">
                    {daysUntilDeadline > 0 
                      ? `${daysUntilDeadline} days left`
                      : `${Math.abs(daysUntilDeadline)} days overdue`
                    }
                  </span>
                  <span className="sm:hidden">
                    {daysUntilDeadline > 0 
                      ? `${daysUntilDeadline}d`
                      : `-${Math.abs(daysUntilDeadline)}d`
                    }
                  </span>
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Link href={`/dashboard/projects/${project.id}/tasks`}>
            <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm px-2 sm:px-4">
              <CheckSquare className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">View Tasks</span>
              <span className="sm:hidden">Tasks</span>
            </Button>
          </Link>
          <Link href={`/dashboard/projects/${project.id}/messages`}>
            <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm px-2 sm:px-4">
              <MessageSquare className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Messages</span>
              <span className="sm:hidden">Chat</span>
            </Button>
          </Link>
          <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm px-2 sm:px-4">
            <Settings className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Config</span>
          </Button>
          <Button onClick={onEdit} className="w-full sm:w-auto text-xs sm:text-sm px-2 sm:px-4">
            <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Edit Project</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {project.completedTasks} of {project.totalTasks} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{project.totalMembers}</div>
            <div className="flex -space-x-2 mt-2">
              {members.slice(0, 4).map((member) => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={member.avatarUrl} alt={member.name} />
                  <AvatarFallback className="text-xs">
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 4 && (
                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                  +{members.length - 4}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{project.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {project.totalTasks - project.completedTasks} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Deadline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {project.deadline 
                ? new Date(project.deadline).toLocaleDateString()
                : "Not set"
              }
            </div>
            {daysUntilDeadline !== null && (
              <p className={`text-xs mt-1 ${
                daysUntilDeadline < 7 ? "text-destructive" : "text-muted-foreground"
              }`}>
                {daysUntilDeadline > 0 
                  ? `${daysUntilDeadline} days remaining`
                  : `${Math.abs(daysUntilDeadline)} days overdue`
                }
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              Active contributors to this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                    <AvatarFallback className="text-sm">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {member.role}
                  </Badge>
                </div>
              ))}
              {members.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  And {members.length - 5} more members...
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Member Management */}
        <ProjectMemberManager 
          projectId={project.id} 
          canManage={canManageMembers}
        />

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates and changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={activity.user.avatarUrl} alt={activity.user.name} />
                    <AvatarFallback className="text-xs">
                      {activity.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()} at {" "}
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}