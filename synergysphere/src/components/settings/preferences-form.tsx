"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Settings, Bell, Mail, Moon } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/providers/theme-provider";

interface PreferencesData {
  emailNotifications: {
    projectUpdates: boolean;
    taskAssignments: boolean;
    teamMessages: boolean;
    weeklyDigest: boolean;
  };
  pushNotifications: {
    enabled: boolean;
    taskReminders: boolean;
    mentions: boolean;
  };
  appearance: {
    theme: "light" | "dark" | "system";
    compactMode: boolean;
  };
  privacy: {
    profileVisibility: "public" | "team" | "private";
    activityStatus: boolean;
  };
}

export function PreferencesForm() {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<PreferencesData>({
    emailNotifications: {
      projectUpdates: true,
      taskAssignments: true,
      teamMessages: true,
      weeklyDigest: false,
    },
    pushNotifications: {
      enabled: true,
      taskReminders: true,
      mentions: true,
    },
    appearance: {
      theme: theme as "light" | "dark" | "system",
      compactMode: false,
    },
    privacy: {
      profileVisibility: "team",
      activityStatus: true,
    },
  });

  const updatePreference = (section: keyof PreferencesData, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setError(null);
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    updatePreference("appearance", "theme", newTheme);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update preferences");
      }

      toast.success("Preferences updated successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update preferences";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          Preferences & Settings
        </CardTitle>
        <CardDescription>
          Customize your experience and notification preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Email Notifications</h3>
            </div>
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="project-updates">Project Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about project milestones and status changes
                  </p>
                </div>
                <Switch
                  id="project-updates"
                  checked={preferences.emailNotifications.projectUpdates}
                  onCheckedChange={(checked) =>
                    updatePreference("emailNotifications", "projectUpdates", checked)
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="task-assignments">Task Assignments</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails when tasks are assigned to you
                  </p>
                </div>
                <Switch
                  id="task-assignments"
                  checked={preferences.emailNotifications.taskAssignments}
                  onCheckedChange={(checked) =>
                    updatePreference("emailNotifications", "taskAssignments", checked)
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="team-messages">Team Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about mentions and direct messages
                  </p>
                </div>
                <Switch
                  id="team-messages"
                  checked={preferences.emailNotifications.teamMessages}
                  onCheckedChange={(checked) =>
                    updatePreference("emailNotifications", "teamMessages", checked)
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-digest">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Weekly summary of your projects and team activity
                  </p>
                </div>
                <Switch
                  id="weekly-digest"
                  checked={preferences.emailNotifications.weeklyDigest}
                  onCheckedChange={(checked) =>
                    updatePreference("emailNotifications", "weeklyDigest", checked)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Push Notifications</h3>
            </div>
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-enabled">Enable Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive browser notifications for important updates
                  </p>
                </div>
                <Switch
                  id="push-enabled"
                  checked={preferences.pushNotifications.enabled}
                  onCheckedChange={(checked) =>
                    updatePreference("pushNotifications", "enabled", checked)
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="task-reminders">Task Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Reminders for upcoming task deadlines
                  </p>
                </div>
                <Switch
                  id="task-reminders"
                  checked={preferences.pushNotifications.taskReminders}
                  onCheckedChange={(checked) =>
                    updatePreference("pushNotifications", "taskReminders", checked)
                  }
                  disabled={isLoading || !preferences.pushNotifications.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="mentions">Mentions</Label>
                  <p className="text-sm text-muted-foreground">
                    When someone mentions you in comments or messages
                  </p>
                </div>
                <Switch
                  id="mentions"
                  checked={preferences.pushNotifications.mentions}
                  onCheckedChange={(checked) =>
                    updatePreference("pushNotifications", "mentions", checked)
                  }
                  disabled={isLoading || !preferences.pushNotifications.enabled}
                />
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Moon className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Appearance</h3>
            </div>
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred color scheme
                  </p>
                </div>
                <Select
                  value={preferences.appearance.theme}
                  onValueChange={(value: "light" | "dark" | "system") =>
                    handleThemeChange(value)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use a more compact interface with reduced spacing
                  </p>
                </div>
                <Switch
                  id="compact-mode"
                  checked={preferences.appearance.compactMode}
                  onCheckedChange={(checked) =>
                    updatePreference("appearance", "compactMode", checked)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Privacy</h3>
            </div>
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="profile-visibility">Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Who can see your profile information
                  </p>
                </div>
                <Select
                  value={preferences.privacy.profileVisibility}
                  onValueChange={(value: "public" | "team" | "private") =>
                    updatePreference("privacy", "profileVisibility", value)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="team">Team Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="activity-status">Show Activity Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see when you're online and active
                  </p>
                </div>
                <Switch
                  id="activity-status"
                  checked={preferences.privacy.activityStatus}
                  onCheckedChange={(checked) =>
                    updatePreference("privacy", "activityStatus", checked)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}