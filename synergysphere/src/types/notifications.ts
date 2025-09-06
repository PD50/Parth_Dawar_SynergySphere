export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export type NotificationType = 
  | 'mention' 
  | 'reply' 
  | 'task_assigned' 
  | 'task_completed'
  | 'task_comment'
  | 'project_invite'
  | 'project_update'
  | 'deadline_reminder';

export interface NotificationData {
  // For mentions and replies
  messageId?: string;
  messageContent?: string;
  threadId?: string;
  
  // For task-related notifications
  taskId?: string;
  taskTitle?: string;
  
  // For project-related notifications
  projectId?: string;
  projectName?: string;
  
  // Additional context
  url?: string;
  actionText?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationData;
  userId: string; // Recipient
  fromUserId?: string; // Who triggered the notification
  projectId?: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  
  // Populated fields
  fromUser?: User;
  project?: {
    id: string;
    name: string;
    color?: string;
  };
}

export interface NotificationSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  mentions: boolean;
  replies: boolean;
  taskAssignments: boolean;
  taskUpdates: boolean;
  projectInvites: boolean;
  deadlineReminders: boolean;
  digestFrequency: 'realtime' | 'daily' | 'weekly' | 'never';
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  settings: NotificationSettings | null;
  lastFetchedAt?: Date;
}

export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationData;
  userIds: string[]; // Recipients
  fromUserId?: string;
  projectId?: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  projectId?: string;
  isRead?: boolean;
  fromDate?: Date;
  toDate?: Date;
}