"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckSquare,
  Users,
  Clock,
  Target,
  BarChart3
} from "lucide-react";

interface ProjectMetrics {
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  activeMembers: number;
  avgTaskCompletionTime: number; // in days
  velocityTrend: "up" | "down" | "stable";
  productivityScore: number;
  timeToDeadline: number; // in days
}

interface TeamProductivity {
  memberId: string;
  memberName: string;
  tasksCompleted: number;
  tasksAssigned: number;
  completionRate: number;
  avgCompletionTime: number;
}

interface TaskDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface ProjectAnalyticsProps {
  projectId: string;
  projectName: string;
  metrics: ProjectMetrics;
  teamProductivity: TeamProductivity[];
  taskDistribution: TaskDistribution[];
  timeRange: "week" | "month" | "quarter";
}

export function ProjectAnalytics({
  projectId,
  projectName,
  metrics,
  teamProductivity,
  taskDistribution,
  timeRange
}: ProjectAnalyticsProps) {
  const getVelocityIcon = () => {
    switch (metrics.velocityTrend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
    }
  };

  const getProductivityColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{projectName} Analytics</h2>
        <p className="text-muted-foreground">
          Performance insights for the {timeRange === "week" ? "past week" : 
          timeRange === "month" ? "past month" : "past quarter"}
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate}%</div>
            <Progress value={metrics.completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.completedTasks} of {metrics.totalTasks} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Velocity</CardTitle>
            {getVelocityIcon()}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avgTaskCompletionTime}d
            </div>
            <p className="text-xs text-muted-foreground">
              Average completion time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProductivityColor(metrics.productivityScore)}`}>
              {metrics.productivityScore}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on velocity & quality
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time to Deadline</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              metrics.timeToDeadline < 7 ? "text-red-600" : 
              metrics.timeToDeadline < 14 ? "text-yellow-600" : "text-green-600"
            }`}>
              {metrics.timeToDeadline}d
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.timeToDeadline < 0 ? "Overdue" : "Remaining"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckSquare className="mr-2 h-5 w-5" />
              Task Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of tasks by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {taskDistribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{item.count}</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Productivity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Team Productivity
            </CardTitle>
            <CardDescription>
              Individual member performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamProductivity
                .sort((a, b) => b.completionRate - a.completionRate)
                .slice(0, 5)
                .map((member) => (
                <div key={member.memberId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{member.memberName}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {member.completionRate}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{member.tasksCompleted} / {member.tasksAssigned} tasks</span>
                    <span>{member.avgCompletionTime}d avg</span>
                  </div>
                  <Progress value={member.completionRate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Key Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.overdueTasks > 0 && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                <div>
                  <p className="text-sm font-medium">Overdue Tasks Alert</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.overdueTasks} tasks are overdue. Consider reassigning or extending deadlines.
                  </p>
                </div>
              </div>
            )}
            
            {metrics.velocityTrend === "down" && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2" />
                <div>
                  <p className="text-sm font-medium">Velocity Declining</p>
                  <p className="text-xs text-muted-foreground">
                    Team velocity has decreased. Consider reviewing workload distribution.
                  </p>
                </div>
              </div>
            )}
            
            {metrics.productivityScore >= 80 && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <p className="text-sm font-medium">High Performance</p>
                  <p className="text-xs text-muted-foreground">
                    Team is performing excellently with {metrics.productivityScore} productivity score.
                  </p>
                </div>
              </div>
            )}
            
            {metrics.timeToDeadline < 7 && metrics.completionRate < 90 && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                <div>
                  <p className="text-sm font-medium">Deadline Risk</p>
                  <p className="text-xs text-muted-foreground">
                    Project may miss deadline. Consider prioritizing critical tasks.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}