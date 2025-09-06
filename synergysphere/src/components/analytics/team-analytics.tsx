"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  TrendingUp,
  Clock,
  CheckSquare,
  Target,
  Award,
  Activity
} from "lucide-react";

interface TeamMemberMetrics {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  tasksCompleted: number;
  tasksAssigned: number;
  completionRate: number;
  avgCompletionTime: number; // in hours
  productivityScore: number;
  streakDays: number;
  lastActive: string;
}

interface TeamOverview {
  totalMembers: number;
  activeMembers: number;
  avgProductivity: number;
  totalTasksCompleted: number;
  totalTasksAssigned: number;
  teamVelocity: number; // tasks per day
  collaborationScore: number;
}

interface ProjectContribution {
  projectId: string;
  projectName: string;
  tasksCompleted: number;
  timeSpent: number; // in hours
  contributionPercentage: number;
}

interface TeamAnalyticsProps {
  teamOverview: TeamOverview;
  memberMetrics: TeamMemberMetrics[];
  timeRange: "week" | "month" | "quarter";
}

export function TeamAnalytics({
  teamOverview,
  memberMetrics,
  timeRange
}: TeamAnalyticsProps) {
  const getProductivityColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getProductivityBadge = (score: number) => {
    if (score >= 90) return { label: "Excellent", variant: "default" as const };
    if (score >= 80) return { label: "Good", variant: "secondary" as const };
    if (score >= 60) return { label: "Average", variant: "outline" as const };
    return { label: "Needs Improvement", variant: "destructive" as const };
  };

  const sortedMembers = memberMetrics.sort((a, b) => b.productivityScore - a.productivityScore);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Team Analytics</h2>
        <p className="text-muted-foreground">
          Team performance insights for the {timeRange === "week" ? "past week" : 
          timeRange === "month" ? "past month" : "past quarter"}
        </p>
      </div>

      {/* Team Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamOverview.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {teamOverview.activeMembers} active this {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Velocity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamOverview.teamVelocity}</div>
            <p className="text-xs text-muted-foreground">
              tasks completed per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Productivity</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProductivityColor(teamOverview.avgProductivity)}`}>
              {teamOverview.avgProductivity}
            </div>
            <p className="text-xs text-muted-foreground">
              team productivity score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaboration</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamOverview.collaborationScore}</div>
            <p className="text-xs text-muted-foreground">
              collaboration score
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Highest productivity scores this {timeRange}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedMembers.slice(0, 5).map((member, index) => (
                <div key={member.id} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? "bg-yellow-100 text-yellow-800" :
                      index === 1 ? "bg-gray-100 text-gray-800" :
                      index === 2 ? "bg-orange-100 text-orange-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {index + 1}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                      <AvatarFallback className="text-xs">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.tasksCompleted} tasks • {member.avgCompletionTime}h avg
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getProductivityColor(member.productivityScore)}`}>
                      {member.productivityScore}
                    </div>
                    <Badge {...getProductivityBadge(member.productivityScore)} className="text-xs">
                      {getProductivityBadge(member.productivityScore).label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Task Completion Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckSquare className="mr-2 h-5 w-5" />
              Task Completion Rates
            </CardTitle>
            <CardDescription>
              Individual completion percentages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memberMetrics
                .sort((a, b) => b.completionRate - a.completionRate)
                .slice(0, 6)
                .map((member) => (
                <div key={member.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                        <AvatarFallback className="text-xs">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{member.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {member.tasksCompleted}/{member.tasksAssigned}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {member.completionRate}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={member.completionRate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Member Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Detailed Member Metrics
          </CardTitle>
          <CardDescription>
            Comprehensive performance breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 text-sm font-medium">Member</th>
                  <th className="pb-2 text-sm font-medium">Role</th>
                  <th className="pb-2 text-sm font-medium">Completed</th>
                  <th className="pb-2 text-sm font-medium">Rate</th>
                  <th className="pb-2 text-sm font-medium">Avg Time</th>
                  <th className="pb-2 text-sm font-medium">Streak</th>
                  <th className="pb-2 text-sm font-medium">Score</th>
                  <th className="pb-2 text-sm font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {memberMetrics.map((member) => (
                  <tr key={member.id} className="border-b">
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatarUrl} alt={member.name} />
                          <AvatarFallback className="text-xs">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm">
                      {member.tasksCompleted}/{member.tasksAssigned}
                    </td>
                    <td className="py-3 text-sm">
                      {member.completionRate}%
                    </td>
                    <td className="py-3 text-sm">
                      {member.avgCompletionTime}h
                    </td>
                    <td className="py-3 text-sm">
                      {member.streakDays}d
                    </td>
                    <td className="py-3">
                      <span className={`text-sm font-medium ${getProductivityColor(member.productivityScore)}`}>
                        {member.productivityScore}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {new Date(member.lastActive).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}