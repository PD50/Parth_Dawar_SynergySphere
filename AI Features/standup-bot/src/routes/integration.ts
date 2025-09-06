import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { aggregateProjectHealth } from '../services/aggregation.js';
import { composeStandup } from '../services/composition.js';

const CreateProjectSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  timezone: z.string().optional().default('Asia/Kolkata'),
  business_days_only: z.boolean().optional().default(true),
  slack_mode: z.enum(['webhook', 'bot']).optional().default('webhook'),
  slack_webhook_url: z.string().optional(),
  slack_bot_token: z.string().optional(),
  slack_channel_id: z.string().optional()
});

const CreateUserSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  active: z.boolean().optional().default(true),
  capacity_score: z.number().min(0).max(1).optional().default(0.8)
});

const CreateTaskSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  title: z.string(),
  status: z.string(),
  status_category: z.enum(['todo', 'doing', 'blocked', 'done']),
  priority: z.number().min(1).max(5).optional().default(1),
  assignee_id: z.string().optional(),
  due_at: z.string().datetime().optional()
});

const GenerateStandupSchema = z.object({
  project_id: z.string(),
  hours: z.number().min(24).max(48).optional().default(24),
  include_slack_post: z.boolean().optional().default(false)
});

export async function integrationRoutes(fastify: FastifyInstance) {
  
  // Get all projects
  fastify.get('/api/integration/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const projects = await prisma.project.findMany({
        select: {
          id: true,
          name: true,
          timezone: true,
          business_days_only: true,
          created_at: true,
          _count: {
            select: {
              tasks: true
            }
          }
        }
      });

      return {
        success: true,
        data: projects
      };
    } catch (error: any) {
      fastify.log.error('Failed to fetch projects:', error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // Create a new project
  fastify.post('/api/integration/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = CreateProjectSchema.parse(request.body);
      
      const project = await prisma.project.create({
        data: {
          ...data,
          id: data.id || undefined
        }
      });

      return {
        success: true,
        data: project
      };
    } catch (error: any) {
      fastify.log.error('Failed to create project:', error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // Get all users
  fastify.get('/api/integration/users', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          active: true,
          capacity_score: true,
          created_at: true,
          _count: {
            select: {
              tasks: true
            }
          }
        }
      });

      return {
        success: true,
        data: users
      };
    } catch (error: any) {
      fastify.log.error('Failed to fetch users:', error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // Create a new user
  fastify.post('/api/integration/users', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = CreateUserSchema.parse(request.body);
      
      const user = await prisma.user.create({
        data: {
          ...data,
          id: data.id || undefined
        }
      });

      return {
        success: true,
        data: user
      };
    } catch (error: any) {
      fastify.log.error('Failed to create user:', error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // Get tasks for a project
  fastify.get('/api/integration/projects/:projectId/tasks', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      
      const tasks = await prisma.task.findMany({
        where: { project_id: projectId },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { due_at: 'asc' }
        ]
      });

      return {
        success: true,
        data: tasks
      };
    } catch (error: any) {
      fastify.log.error('Failed to fetch tasks:', error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // Create or update tasks (bulk operation)
  fastify.post('/api/integration/tasks', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tasks = z.array(CreateTaskSchema).parse(request.body);
      
      const results = [];
      for (const taskData of tasks) {
        const task = await prisma.task.upsert({
          where: { id: taskData.id },
          create: {
            ...taskData,
            due_at: taskData.due_at ? new Date(taskData.due_at) : null
          },
          update: {
            ...taskData,
            due_at: taskData.due_at ? new Date(taskData.due_at) : null
          }
        });
        results.push(task);
      }

      return {
        success: true,
        data: results,
        count: results.length
      };
    } catch (error: any) {
      fastify.log.error('Failed to create/update tasks:', error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // Generate standup (integration-friendly)
  fastify.post('/api/integration/standup/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { project_id, hours, include_slack_post } = GenerateStandupSchema.parse(request.body);
      
      // Generate the standup content
      const payload = await aggregateProjectHealth(project_id, hours as 24 | 48);
      const composed = await composeStandup(payload);
      
      // Get project info
      const project = await prisma.project.findUnique({
        where: { id: project_id },
        select: { name: true }
      });

      const response = {
        success: true,
        data: {
          project_id,
          project_name: project?.name || 'Unknown Project',
          standup_text: composed.post_text,
          metrics: composed.metrics,
          payload_hash: payload.payload_hash,
          generated_at: new Date().toISOString(),
          tasks_included: {
            overdue: payload.at_risk.overdue.length,
            due_soon: payload.at_risk.due_soon.length,
            completed_recently: payload.moved_done.count
          }
        }
      };

      // Optionally post to Slack if requested
      if (include_slack_post && project) {
        try {
          // This would trigger the regular Slack posting flow
          const standupResponse = await fetch(`http://localhost:${process.env.PORT || 3000}/api/standup/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': process.env.API_KEY || 'dev-local-key'
            },
            body: JSON.stringify({
              projectId: project_id,
              hours
            })
          });

          if (standupResponse.ok) {
            response.data = {
              ...response.data,
              slack_posted: true
            };
          }
        } catch (slackError) {
          fastify.log.warn('Slack posting failed:', slackError);
          response.data = {
            ...response.data,
            slack_posted: false,
            slack_error: 'Failed to post to Slack'
          };
        }
      }

      return response;
    } catch (error: any) {
      fastify.log.error('Failed to generate standup:', error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // Get project health summary
  fastify.get('/api/integration/projects/:projectId/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const { hours = 24 } = request.query as { hours?: number };
      
      const payload = await aggregateProjectHealth(projectId, hours as 24 | 48);
      
      return {
        success: true,
        data: {
          project_id: projectId,
          project_name: payload.project,
          health_summary: {
            tasks_completed_recently: payload.moved_done.count,
            overdue_tasks: payload.at_risk.overdue.length,
            due_soon_tasks: payload.at_risk.due_soon.length,
            total_open_tasks: payload.open_counts.open,
            suggested_actions: payload.suggested_owners.length
          },
          last_updated: new Date().toISOString()
        }
      };
    } catch (error: any) {
      fastify.log.error('Failed to get project health:', error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });
}