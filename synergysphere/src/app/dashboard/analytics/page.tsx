"use client";

import { useState, useEffect } from "react";
import { ProjectAnalytics } from "@/components/analytics/project-analytics";
import { TeamAnalytics } from "@/components/analytics/team-analytics";
import { PageLoader } from "@/components/ui/page-loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Calendar, RefreshCw, Users, Target } from "lucide-react";

// Mock analytics data
const mockAnalyticsData = {
  "1": {
    projectId: "1",
    projectName: "SynergySphere MVP",
    metrics: {
      completionRate: 67,
      totalTasks: 24,
      completedTasks: 16,
      overdueTasks: 2,
      activeMembers: 5,
      avgTaskCompletionTime: 3.2,
      velocityTrend: "up" as const,
      productivityScore: 85,
      timeToDeadline: 25,
    },
    teamProductivity: [
      {
        memberId: "1",
        memberName: "Alice Johnson",
        tasksCompleted: 8,
        tasksAssigned: 10,
        completionRate: 80,
        avgCompletionTime: 2.8,
      },
      {
        memberId: "2",
        memberName: "Bob Smith",
        tasksCompleted: 4,
        tasksAssigned: 5,
        completionRate: 80,
        avgCompletionTime: 3.1,
      },
      {
        memberId: "3",
        memberName: "Carol Davis",
        tasksCompleted: 3,
        tasksAssigned: 4,
        completionRate: 75,
        avgCompletionTime: 3.5,
      },
      {
        memberId: "4",
        memberName: "David Wilson",
        tasksCompleted: 1,
        tasksAssigned: 3,
        completionRate: 33,
        avgCompletionTime: 4.2,
      },
      {
        memberId: "5",
        memberName: "Eve Martinez",
        tasksCompleted: 0,
        tasksAssigned: 2,
        completionRate: 0,
        avgCompletionTime: 0,
      },
    ],
    taskDistribution: [
      { status: "Completed", count: 16, percentage: 67, color: "#10b981" },
      { status: "In Progress", count: 6, percentage: 25, color: "#3b82f6" },
      { status: "Overdue", count: 2, percentage: 8, color: "#ef4444" },
    ],
  },
  "2": {
    projectId: "2",
    projectName: "Marketing Website",
    metrics: {
      completionRate: 40,
      totalTasks: 15,
      completedTasks: 6,
      overdueTasks: 1,
      activeMembers: 3,
      avgTaskCompletionTime: 4.1,
      velocityTrend: "stable" as const,
      productivityScore: 72,
      timeToDeadline: 10,
    },
    teamProductivity: [
      {
        memberId: "1",
        memberName: "Alice Johnson",
        tasksCompleted: 2,
        tasksAssigned: 5,
        completionRate: 40,
        avgCompletionTime: 3.8,
      },
      {
        memberId: "6",
        memberName: "Frank Brown",
        tasksCompleted: 2,
        tasksAssigned: 5,
        completionRate: 40,
        avgCompletionTime: 4.2,
      },
      {
        memberId: "7",
        memberName: "Grace Lee",
        tasksCompleted: 2,
        tasksAssigned: 5,
        completionRate: 40,
        avgCompletionTime: 4.5,
      },
    ],
    taskDistribution: [
      { status: "Completed", count: 6, percentage: 40, color: "#10b981" },
      { status: "In Progress", count: 8, percentage: 53, color: "#3b82f6" },
      { status: "Overdue", count: 1, percentage: 7, color: "#ef4444" },
    ],
  },
};

// Mock team analytics data
const mockTeamAnalytics = {
  teamOverview: {
    totalMembers: 7,
    activeMembers: 6,
    avgProductivity: 79,
    totalTasksCompleted: 22,
    totalTasksAssigned: 39,
    teamVelocity: 3.2,
    collaborationScore: 85,
  },
  memberMetrics: [
    {
      id: "1",
      name: "Alice Johnson",
      email: "alice@synergysphere.com",
      avatarUrl: "",
      role: "OWNER" as const,
      tasksCompleted: 10,
      tasksAssigned: 15,
      completionRate: 67,
      avgCompletionTime: 18,
      productivityScore: 85,
      streakDays: 12,
      lastActive: "2024-01-20T15:30:00Z",
    },
    {
      id: "2",
      name: "Bob Smith",
      email: "bob@synergysphere.com",
      avatarUrl: "",
      role: "ADMIN" as const,
      tasksCompleted: 6,
      tasksAssigned: 10,
      completionRate: 60,
      avgCompletionTime: 22,
      productivityScore: 78,
      streakDays: 8,
      lastActive: "2024-01-20T14:20:00Z",
    },
    {
      id: "3",
      name: "Carol Davis",
      email: "carol@synergysphere.com",
      avatarUrl: "",
      role: "MEMBER" as const,
      tasksCompleted: 3,
      tasksAssigned: 4,
      completionRate: 75,
      avgCompletionTime: 20,
      productivityScore: 82,
      streakDays: 5,
      lastActive: "2024-01-20T13:45:00Z",
    },
    {
      id: "4",
      name: "David Wilson",
      email: "david@synergysphere.com",
      avatarUrl: "",
      role: "MEMBER" as const,
      tasksCompleted: 1,
      tasksAssigned: 3,
      completionRate: 33,
      avgCompletionTime: 28,
      productivityScore: 65,
      streakDays: 2,
      lastActive: "2024-01-20T16:00:00Z",
    },
    {
      id: "5",
      name: "Eve Martinez",
      email: "eve@synergysphere.com",
      avatarUrl: "",
      role: "MEMBER" as const,
      tasksCompleted: 0,
      tasksAssigned: 2,
      completionRate: 0,
      avgCompletionTime: 0,
      productivityScore: 45,
      streakDays: 0,
      lastActive: "2024-01-19T10:30:00Z",
    },
    {
      id: "6",
      name: "Frank Brown",
      email: "frank@synergysphere.com",
      avatarUrl: "",
      role: "ADMIN" as const,
      tasksCompleted: 2,
      tasksAssigned: 5,
      completionRate: 40,
      avgCompletionTime: 24,
      productivityScore: 72,
      streakDays: 4,
      lastActive: "2024-01-19T14:30:00Z",
    },
  ],
};

export default function AnalyticsPage() {
  const [selectedProject, setSelectedProject] = useState("1");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API call - in real app this would be:
      // const response = await fetch(`/api/projects/${selectedProject}/analytics?timeRange=${timeRange}`);
      // const result = await response.json();
      
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate loading
      
      const analyticsData = mockAnalyticsData[selectedProject as keyof typeof mockAnalyticsData];
      if (!analyticsData) {
        throw new Error("Analytics data not found");
      }
      
      setData(analyticsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch analytics data";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedProject, timeRange]);

  if (isLoading) {
    return <PageLoader message="Loading analytics data..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Analytics</h1>
            <p className="text-muted-foreground">
              Track performance and get insights into your projects
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track performance and get insights into your projects and team
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={(value: "week" | "month" | "quarter") => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="quarter">Past Quarter</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Currently tracked projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Completion</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">54%</div>
            <p className="text-xs text-muted-foreground">
              Across all active projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTeamAnalytics.teamOverview.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {mockTeamAnalytics.teamOverview.activeMembers} active this {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Productivity</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTeamAnalytics.teamOverview.avgProductivity}</div>
            <p className="text-xs text-muted-foreground">
              Average productivity score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projects" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Project Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Team Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Project Performance</h2>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">SynergySphere MVP</SelectItem>
                <SelectItem value="2">Marketing Website</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {data && (
            <ProjectAnalytics
              projectId={data.projectId}
              projectName={data.projectName}
              metrics={data.metrics}
              teamProductivity={data.teamProductivity}
              taskDistribution={data.taskDistribution}
              timeRange={timeRange}
            />
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <TeamAnalytics
            teamOverview={mockTeamAnalytics.teamOverview}
            memberMetrics={mockTeamAnalytics.memberMetrics}
            timeRange={timeRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}