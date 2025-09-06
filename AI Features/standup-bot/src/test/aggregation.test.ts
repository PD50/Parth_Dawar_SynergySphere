import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// import { PrismaClient } from '@prisma/client';
import { aggregateProjectHealth } from '../services/aggregation.js';

// const prisma = new PrismaClient();

import { prisma } from "../db.js";

describe('Aggregation Service', () => {
  let projectId: string;
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        active: true,
        capacity_score: 1.0
      }
    });
    userId = user.id;

    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        timezone: 'UTC',
        business_days_only: false,
        slack_mode: 'webhook',
        slack_webhook_url: 'https://example.com/webhook'
      }
    });
    projectId = project.id;

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const completedTask = await prisma.task.create({
      data: {
        project_id: projectId,
        title: 'Completed task',
        status: 'Done',
        status_category: 'done',
        priority: 1,
        assignee_id: userId,
        due_at: yesterday
      }
    });

    await prisma.task.create({
      data: {
        project_id: projectId,
        title: 'Overdue task',
        status: 'In Progress',
        status_category: 'doing',
        priority: 2,
        assignee_id: userId,
        due_at: yesterday
      }
    });

    await prisma.task.create({
      data: {
        project_id: projectId,
        title: 'Due soon task',
        status: 'To Do',
        status_category: 'todo',
        priority: 1,
        assignee_id: userId,
        due_at: tomorrow
      }
    });

    await prisma.taskActivity.create({
      data: {
        project_id: projectId,
        task_id: completedTask.id,
        from_status: 'In Progress',
        to_status: 'Done',
        at: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        actor_id: userId
      }
    });
  });

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { project_id: projectId } });
    await prisma.taskActivity.deleteMany({ where: { project_id: projectId } });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('should aggregate project health correctly', async () => {
    const result = await aggregateProjectHealth(projectId, 24);

    expect(result).toMatchObject({
      project_id: projectId,
      window_hours: 24,
      status_model: 'canonical_v1'
    });

    expect(result.moved_done.count).toBe(1);
    expect(result.moved_done.examples).toContain('Completed task');

    expect(result.at_risk.overdue).toHaveLength(1);
    expect(result.at_risk.overdue[0]?.title).toBe('Overdue task');

    expect(result.at_risk.due_soon).toHaveLength(1);
    expect(result.at_risk.due_soon[0]?.title).toBe('Due soon task');

    expect(result.open_counts.open).toBeGreaterThanOrEqual(2);
    expect(result.open_counts.overdue).toBeGreaterThanOrEqual(1);

    expect(result.payload_hash).toHaveLength(64);
    expect(result.sanitization.markdown_escaped).toBe(true);
    expect(result.sanitization.mentions_stripped).toBe(true);
    expect(result.max_items).toBe(3);
  });

  it('should handle projects with no recent activity', async () => {
    const emptyProject = await prisma.project.create({
      data: {
        name: 'Empty Test Project',
        timezone: 'UTC',
        business_days_only: false,
        slack_mode: 'webhook',
        slack_webhook_url: 'https://example.com/webhook'
      }
    });

    const result = await aggregateProjectHealth(emptyProject.id, 24);

    expect(result.moved_done.count).toBe(0);
    expect(result.moved_done.examples).toHaveLength(0);
    expect(result.at_risk.overdue).toHaveLength(0);
    expect(result.at_risk.due_soon).toHaveLength(0);
    expect(result.open_counts.open).toBe(0);
    expect(result.open_counts.overdue).toBe(0);

    await prisma.project.delete({ where: { id: emptyProject.id } });
  });

  it('should sanitize task titles', async () => {
    const project = await prisma.project.create({
      data: {
        name: 'Sanitization Test Project',
        timezone: 'UTC',
        business_days_only: false,
        slack_mode: 'webhook',
        slack_webhook_url: 'https://example.com/webhook'
      }
    });

    await prisma.task.create({
      data: {
        project_id: project.id,
        title: 'Fix @channel bug with https://example.com and `code`',
        status: 'To Do',
        status_category: 'todo',
        priority: 1,
        assignee_id: userId,
        due_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    const result = await aggregateProjectHealth(project.id, 24);

    expect(result.at_risk.due_soon[0]?.title).not.toContain('@channel');
    expect(result.at_risk.due_soon[0]?.title).not.toContain('https://example.com');
    expect(result.at_risk.due_soon[0]?.title).not.toContain('`');

    await prisma.task.deleteMany({ where: { project_id: project.id } });
    await prisma.project.delete({ where: { id: project.id } });
  });
});