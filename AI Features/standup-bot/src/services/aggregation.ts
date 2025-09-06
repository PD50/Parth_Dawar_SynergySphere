// import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { AggregationPayload, OwnerCandidate, TaskWithAssignee } from '../types/index.js';

// const prisma = new PrismaClient();

import { prisma } from "../db.js";

export async function aggregateProjectHealth(
  projectId: string,
  windowHours: 24 | 48 = 24
): Promise<AggregationPayload> {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000);
  const windowEnd = now;

  const isBusinessDay = await checkBusinessDay(now, project.timezone, project.business_days_only);

  const movedDone = await getMovedDoneTasks(projectId, windowStart, windowEnd);
  const { atRisk, openCounts } = await getAtRiskTasks(projectId, now);
  const suggestedOwners = await generateOwnerSuggestions(atRisk);

  const maxItems = 3;
  const limitedOverdue = atRisk.overdue.slice(0, maxItems);
  const limitedDueSoon = atRisk.due_soon.slice(0, maxItems);
  
  const allowedTaskIds = [
    ...limitedOverdue.map(t => t.id),
    ...limitedDueSoon.map(t => t.id)
  ];

  const payload: Omit<AggregationPayload, 'payload_hash'> = {
    project: project.name,
    project_id: projectId,
    window_hours: windowHours,
    window_start: windowStart.toISOString(),
    window_end: windowEnd.toISOString(),
    status_model: "canonical_v1",
    moved_done: {
      count: movedDone.count,
      examples: movedDone.examples.map(sanitizeTitle)
    },
    at_risk: {
      overdue: limitedOverdue.map(task => ({
        id: task.id,
        title: sanitizeTitle(task.title),
        assignee: task.assignee?.name || null,
        priority: task.priority
      })),
      due_soon: limitedDueSoon.map(task => ({
        id: task.id,
        title: sanitizeTitle(task.title),
        assignee: task.assignee?.name || null,
        priority: task.priority,
        due_in_hours: task.due_at ? Math.ceil((task.due_at.getTime() - now.getTime()) / (60 * 60 * 1000)) : 0
      }))
    },
    open_counts: openCounts,
    suggested_owners: suggestedOwners.map(owner => ({
      task_id: owner.user_id,
      suggested_owner: owner.name,
      reason: owner.reason
    })),
    business_calendar: {
      skip_post_today: !isBusinessDay
    },
    mention_policy: process.env.DEFAULT_MENTION_POLICY === 'no_mentions' ? 'no_mentions' : 'names_bold',
    max_items: maxItems,
    allowed_task_ids: allowedTaskIds,
    sanitization: {
      markdown_escaped: true,
      mentions_stripped: true,
      secrets_redacted: true
    }
  };

  const payloadHash = generatePayloadHash(payload);

  return {
    ...payload,
    payload_hash: payloadHash
  };
}

async function getMovedDoneTasks(projectId: string, windowStart: Date, windowEnd: Date) {
  const activities = await prisma.taskActivity.findMany({
    where: {
      project_id: projectId,
      at: {
        gte: windowStart,
        lte: windowEnd
      },
      to_status: {
        in: ['Done', 'done', 'Completed', 'completed']
      }
    },
    include: {
      task: true
    },
    orderBy: {
      at: 'desc'
    }
  });

  const uniqueTaskIds = new Set<string>();
  const examples: string[] = [];

  for (const activity of activities) {
    if (!uniqueTaskIds.has(activity.task_id)) {
      uniqueTaskIds.add(activity.task_id);
      if (examples.length < 3) {
        examples.push(activity.task.title);
      }
    }
  }

  return {
    count: uniqueTaskIds.size,
    examples
  };
}

async function getAtRiskTasks(projectId: string, now: Date) {
  const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const tasks = await prisma.task.findMany({
    where: {
      project_id: projectId,
      status_category: {
        in: ['todo', 'doing', 'blocked']
      },
      OR: [
        { due_at: { lt: now } },
        { 
          due_at: { 
            gte: now,
            lte: fortyEightHoursFromNow
          }
        }
      ]
    },
    include: {
      assignee: true
    },
    orderBy: [
      { priority: 'desc' },
      { due_at: 'asc' }
    ]
  }) as TaskWithAssignee[];

  const overdue = tasks
    .filter(task => task.due_at && task.due_at < now)
    .slice(0, 3);

  const dueSoon = tasks
    .filter(task => task.due_at && task.due_at >= now && task.due_at <= fortyEightHoursFromNow)
    .slice(0, 3);

  const openTotal = await prisma.task.count({
    where: {
      project_id: projectId,
      status_category: {
        in: ['todo', 'doing', 'blocked']
      }
    }
  });

  const overdueTotal = await prisma.task.count({
    where: {
      project_id: projectId,
      due_at: { lt: now },
      status_category: { not: 'done' }
    }
  });

  return {
    atRisk: { overdue, due_soon: dueSoon },
    openCounts: { open: openTotal, overdue: overdueTotal }
  };
}

async function generateOwnerSuggestions(atRisk: { overdue: TaskWithAssignee[]; due_soon: TaskWithAssignee[] }): Promise<OwnerCandidate[]> {
  const allTasks = [...atRisk.overdue, ...atRisk.due_soon];
  const suggestions: OwnerCandidate[] = [];
  const assignmentCounts = new Map<string, number>();

  for (const task of allTasks) {
    let bestCandidate: OwnerCandidate | null = null;
    let bestScore = -1;

    if (task.assignee && task.assignee.active) {
      const currentCount = assignmentCounts.get(task.assignee.id) || 0;
      if (currentCount < 2) {
        bestCandidate = {
          user_id: task.id,
          name: task.assignee.name,
          score: 1.0,
          reason: `Currently assigned to ${task.assignee.name}`
        };
        bestScore = 1.0;
      }
    }

    if (!bestCandidate) {
      const recentActor = await getRecentTaskActor(task.id);
      if (recentActor) {
        const currentCount = assignmentCounts.get(recentActor.id) || 0;
        if (currentCount < 2) {
          const score = 0.8;
          if (score > bestScore) {
            bestCandidate = {
              user_id: task.id,
              name: recentActor.name,
              score,
              reason: `Recent activity by ${recentActor.name}`
            };
            bestScore = score;
          }
        }
      }
    }

    if (!bestCandidate) {
      const componentOwner = await getComponentDefaultOwner(task.id);
      if (componentOwner) {
        const currentCount = assignmentCounts.get(componentOwner.id) || 0;
        if (currentCount < 2) {
          const score = 0.6;
          if (score > bestScore) {
            bestCandidate = {
              user_id: task.id,
              name: componentOwner.name,
              score,
              reason: `Default owner for component`
            };
            bestScore = score;
          }
        }
      }
    }

    if (bestCandidate) {
      suggestions.push(bestCandidate);
      const userId = task.assignee?.id || bestCandidate.name;
      assignmentCounts.set(userId, (assignmentCounts.get(userId) || 0) + 1);
    }
  }

  return suggestions;
}

async function getRecentTaskActor(taskId: string) {
  const recentActivity = await prisma.taskActivity.findFirst({
    where: {
      task_id: taskId,
      at: {
        gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      }
    },
    include: {
      actor: true
    },
    orderBy: {
      at: 'desc'
    }
  });

  return recentActivity?.actor && recentActivity.actor.active ? recentActivity.actor : null;
}

async function getComponentDefaultOwner(taskId: string) {
  const taskComponent = await prisma.taskComponent.findFirst({
    where: { task_id: taskId },
    include: {
      component: {
        include: {
          default_owner: true
        }
      }
    }
  });

  return taskComponent?.component?.default_owner?.active ? taskComponent.component.default_owner : null;
}

function sanitizeTitle(title: string): string {
  return title
    .replace(/@\w+/g, '')
    .replace(/`/g, "'")
    .replace(/https?:\/\/[^\s]+/g, '[URL]')
    .replace(/\b[A-Za-z0-9]{32,}\b/g, '[TOKEN]')
    .replace(/[*_~]/g, '')
    .trim();
}

async function checkBusinessDay(date: Date, timezone: string, businessDaysOnly: boolean): Promise<boolean> {
  if (!businessDaysOnly) return true;

  const dayOfWeek = date.getUTCDay();
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

function generatePayloadHash(payload: Omit<AggregationPayload, 'payload_hash'>): string {
  const normalized = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash('sha256').update(normalized).digest('hex');
}