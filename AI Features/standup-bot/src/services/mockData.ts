import { AggregationPayload } from '../types/index.js';

// Mock project data for testing without database
export const mockProjects = {
  'demo-project-1': {
    id: 'demo-project-1',
    name: 'Demo E-commerce Platform',
    timezone: 'America/New_York',
    business_days_only: true,
    slack_mode: 'webhook' as const,
    slack_webhook_url: 'https://hooks.slack.com/services/DEMO/WEBHOOK/URL'
  }
};

export const mockUsers = {
  'user-1': { id: 'user-1', name: 'Alice Johnson', email: 'alice@demo.com', active: true, capacity_score: 1.0 },
  'user-2': { id: 'user-2', name: 'Bob Smith', email: 'bob@demo.com', active: true, capacity_score: 0.8 },
  'user-3': { id: 'user-3', name: 'Charlie Brown', email: 'charlie@demo.com', active: true, capacity_score: 1.2 },
  'user-4': { id: 'user-4', name: 'Diana Prince', email: 'diana@demo.com', active: true, capacity_score: 1.1 }
};

export const mockTasks = {
  'task-1': {
    id: 'task-1',
    project_id: 'demo-project-1',
    title: 'Implement user authentication system',
    status: 'Done',
    status_category: 'done' as const,
    priority: 3,
    assignee_id: 'user-1',
    due_at: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    assignee: mockUsers['user-1']
  },
  'task-2': {
    id: 'task-2',
    project_id: 'demo-project-1',
    title: 'Fix critical payment gateway bug',
    status: 'In Progress',
    status_category: 'doing' as const,
    priority: 3,
    assignee_id: 'user-2',
    due_at: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    assignee: mockUsers['user-2']
  },
  'task-3': {
    id: 'task-3',
    project_id: 'demo-project-1',
    title: 'Database migration for order history',
    status: 'Blocked',
    status_category: 'blocked' as const,
    priority: 2,
    assignee_id: 'user-3',
    due_at: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago (overdue)
    assignee: mockUsers['user-3']
  },
  'task-4': {
    id: 'task-4',
    project_id: 'demo-project-1',
    title: 'Design new product catalog UI',
    status: 'To Do',
    status_category: 'todo' as const,
    priority: 1,
    assignee_id: 'user-4',
    due_at: new Date(Date.now() + 36 * 60 * 60 * 1000), // 36 hours from now
    assignee: mockUsers['user-4']
  },
  'task-5': {
    id: 'task-5',
    project_id: 'demo-project-1',
    title: 'Setup CI/CD pipeline',
    status: 'Done',
    status_category: 'done' as const,
    priority: 2,
    assignee_id: 'user-2',
    due_at: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
    assignee: mockUsers['user-2']
  },
  'task-6': {
    id: 'task-6',
    project_id: 'demo-project-1',
    title: 'Update API documentation',
    status: 'In Review',
    status_category: 'doing' as const,
    priority: 1,
    assignee_id: 'user-1',
    due_at: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
    assignee: mockUsers['user-1']
  }
};

export const mockTaskActivities = [
  {
    id: 'activity-1',
    project_id: 'demo-project-1',
    task_id: 'task-1',
    from_status: 'In Progress',
    to_status: 'Done',
    at: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    actor_id: 'user-1',
    note: 'Completed OAuth integration and testing'
  },
  {
    id: 'activity-2',
    project_id: 'demo-project-1',
    task_id: 'task-5',
    from_status: 'In Progress',
    to_status: 'Done',
    at: new Date(Date.now() - 14 * 60 * 60 * 1000), // 14 hours ago
    actor_id: 'user-2',
    note: 'Pipeline tested and deployed to staging'
  },
  {
    id: 'activity-3',
    project_id: 'demo-project-1',
    task_id: 'task-2',
    from_status: 'To Do',
    to_status: 'In Progress',
    at: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    actor_id: 'user-2',
    note: 'Started debugging payment gateway timeout issues'
  }
];

// Generate mock aggregation payload
export function generateMockAggregationPayload(projectId: string, windowHours: 24 | 48 = 24): AggregationPayload {
  const project = mockProjects[projectId as keyof typeof mockProjects];
  if (!project) {
    throw new Error(`Mock project ${projectId} not found`);
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000);

  // Tasks completed in window
  const completedTasks = Object.values(mockTasks).filter(task => {
    return task.project_id === projectId && 
           task.status_category === 'done' &&
           task.due_at && task.due_at >= windowStart;
  });

  // At-risk tasks
  const overdueTasks = Object.values(mockTasks).filter(task => {
    return task.project_id === projectId &&
           task.status_category !== 'done' &&
           task.due_at && task.due_at < now;
  }).slice(0, 3);

  const dueSoonTasks = Object.values(mockTasks).filter(task => {
    return task.project_id === projectId &&
           task.status_category !== 'done' &&
           task.due_at && 
           task.due_at >= now && 
           task.due_at <= new Date(now.getTime() + 48 * 60 * 60 * 1000);
  }).slice(0, 3);

  const openTasks = Object.values(mockTasks).filter(task => 
    task.project_id === projectId && task.status_category !== 'done'
  );

  const overdueTasksTotal = Object.values(mockTasks).filter(task => 
    task.project_id === projectId && 
    task.status_category !== 'done' && 
    task.due_at && task.due_at < now
  );

  const payload: AggregationPayload = {
    project: project.name,
    project_id: projectId,
    window_hours: windowHours,
    window_start: windowStart.toISOString(),
    window_end: now.toISOString(),
    status_model: "canonical_v1",
    moved_done: {
      count: completedTasks.length,
      examples: completedTasks.map(t => t.title).slice(0, 3)
    },
    at_risk: {
      overdue: overdueTasks.map(task => ({
        id: task.id,
        title: task.title,
        assignee: task.assignee?.name || null,
        priority: task.priority
      })),
      due_soon: dueSoonTasks.map(task => ({
        id: task.id,
        title: task.title,
        assignee: task.assignee?.name || null,
        priority: task.priority,
        due_in_hours: task.due_at ? Math.ceil((task.due_at.getTime() - now.getTime()) / (60 * 60 * 1000)) : 0
      }))
    },
    open_counts: {
      open: openTasks.length,
      overdue: overdueTasksTotal.length
    },
    suggested_owners: [
      { task_id: 'task-2', suggested_owner: 'Bob Smith', reason: 'Currently assigned and has recent activity' },
      { task_id: 'task-3', suggested_owner: 'Charlie Brown', reason: 'Currently assigned to blocked task' },
      { task_id: 'task-6', suggested_owner: 'Alice Johnson', reason: 'Currently assigned and available' }
    ],
    business_calendar: {
      skip_post_today: false
    },
    mention_policy: 'names_bold' as const,
    max_items: 3,
    allowed_task_ids: [
      ...overdueTasks.map(t => t.id),
      ...dueSoonTasks.map(t => t.id)
    ],
    sanitization: {
      markdown_escaped: true,
      mentions_stripped: true,
      secrets_redacted: true
    },
    payload_hash: 'mock-hash-' + Date.now().toString(36)
  };

  return payload;
}

// Mock standup posts for testing
export const mockStandupPosts = [
  {
    id: 'post-1',
    project_id: 'demo-project-1',
    window_hours: 24,
    window_start: new Date(Date.now() - 24 * 60 * 60 * 1000),
    window_end: new Date(),
    payload_hash: 'previous-hash-123',
    body: '**Yesterday:** Completed user authentication system, CI/CD pipeline (2 tasks)\n**At risk:** Payment gateway bug (due in 4h, **Bob**), Database migration (overdue, **Charlie**)\n**Next:**\n• **Bob**: Debug payment timeout issues, test edge cases\n• **Charlie**: Resolve migration blockers, coordinate with DevOps\n• **Alice**: Complete API documentation review',
    posted_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
  }
];