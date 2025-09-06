// Application constants
export const APP_NAME = 'SynergySphere';
export const APP_DESCRIPTION = 'Modern team collaboration platform';

// Task statuses
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress', 
  DONE: 'done'
} as const;

// Task priorities
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

// User roles
export const USER_ROLE = {
  OWNER: 'owner',
  MEMBER: 'member'
} as const;