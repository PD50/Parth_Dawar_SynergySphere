import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { composeStandup } from '../services/composition.js';
import { generateMockAggregationPayload, mockProjects, mockStandupPosts } from '../services/mockData.js';

const DemoPreviewQuerySchema = z.object({
  projectId: z.string().default('demo-project-1'),
  hours: z.coerce.number().int().min(24).max(48).default(24)
});

const DemoGenerateBodySchema = z.object({
  projectId: z.string().default('demo-project-1'),
  hours: z.number().int().min(24).max(48).optional().default(24),
  force: z.boolean().optional().default(false)
});

export async function demoRoutes(fastify: FastifyInstance) {
  // Demo: List available mock projects
  fastify.get('/demo/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      message: 'Available demo projects (no database required)',
      projects: Object.values(mockProjects).map(p => ({
        id: p.id,
        name: p.name,
        timezone: p.timezone,
        slack_mode: p.slack_mode
      }))
    };
  });

  // Demo: Preview stand-up with mock data
  fastify.get('/demo/standup/preview', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = DemoPreviewQuerySchema.parse(request.query);
    
    try {
      fastify.log.info('Generating demo preview', { projectId: query.projectId, hours: query.hours });
      
      const payload = generateMockAggregationPayload(query.projectId, query.hours as 24 | 48);
      const composed = await composeStandup(payload);
      
      const lastPost = mockStandupPosts.find(p => p.project_id === query.projectId);

      return {
        message: 'Demo preview generated with mock data (no database required)',
        payload,
        composed,
        last_post: lastPost ? {
          id: lastPost.id,
          posted_at: lastPost.posted_at,
          window_hours: lastPost.window_hours,
          payload_hash: lastPost.payload_hash,
          body: lastPost.body
        } : null
      };
    } catch (error: any) {
      fastify.log.error('Demo preview failed:', error);
      reply.code(500).send({ error: error.message });
    }
  });

  // Demo: Generate stand-up with mock data (simulated)
  fastify.post('/demo/standup/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = DemoGenerateBodySchema.parse(request.body);
    
    try {
      fastify.log.info('Generating demo stand-up', { projectId: body.projectId, hours: body.hours });
      
      const payload = generateMockAggregationPayload(body.projectId, body.hours as 24 | 48);
      
      // Simulate idempotency check
      if (!body.force) {
        const recentPost = mockStandupPosts.find(p => 
          p.project_id === body.projectId && 
          p.posted_at > new Date(Date.now() - 6 * 60 * 60 * 1000)
        );

        if (recentPost && recentPost.payload_hash === payload.payload_hash) {
          reply.code(304);
          return { 
            status: 'noop', 
            message: 'Identical demo post already exists within 6 hours (simulated)',
            demo: true
          };
        }
      }

      const composed = await composeStandup(payload);

      // Simulate successful posting (no actual Slack call in demo)
      const simulatedPost = {
        id: 'demo-post-' + Date.now(),
        project_id: body.projectId,
        window_hours: payload.window_hours,
        window_start: payload.window_start,
        window_end: payload.window_end,
        payload_hash: payload.payload_hash,
        body: composed.post_text,
        posted_at: new Date().toISOString()
      };

      return {
        status: 'posted',
        message: 'Demo stand-up generated successfully (no actual Slack posting)',
        demo: true,
        post_id: simulatedPost.id,
        payload_hash: payload.payload_hash,
        composition_method: composed.metrics.composition_method,
        simulated_post: simulatedPost,
        slack_preview: `Would post to Slack:\n\n${composed.post_text}`
      };
    } catch (error: any) {
      fastify.log.error('Demo generation failed:', error);
      reply.code(500).send({ error: error.message, demo: true });
    }
  });

  // Demo: Get sample tasks and data
  fastify.get('/demo/tasks', async (request: FastifyRequest, reply: FastifyReply) => {
    const projectId = (request.query as any).projectId || 'demo-project-1';
    
    try {
      const { mockTasks, mockUsers, mockTaskActivities } = await import('../services/mockData.js');
      
      const projectTasks = Object.values(mockTasks).filter(task => task.project_id === projectId);
      const projectActivities = mockTaskActivities.filter(activity => activity.project_id === projectId);
      
      return {
        message: 'Demo task data (mock data)',
        project_id: projectId,
        tasks: projectTasks,
        users: Object.values(mockUsers),
        recent_activities: projectActivities,
        summary: {
          total_tasks: projectTasks.length,
          completed: projectTasks.filter(t => t.status_category === 'done').length,
          in_progress: projectTasks.filter(t => t.status_category === 'doing').length,
          blocked: projectTasks.filter(t => t.status_category === 'blocked').length,
          todo: projectTasks.filter(t => t.status_category === 'todo').length,
          overdue: projectTasks.filter(t => t.due_at && t.due_at < new Date() && t.status_category !== 'done').length
        }
      };
    } catch (error: any) {
      fastify.log.error('Demo tasks failed:', error);
      reply.code(500).send({ error: error.message });
    }
  });

  // Demo: Test composition with different policies
  fastify.post('/demo/composition/test', async (request: FastifyRequest, reply: FastifyReply) => {
    const { mention_policy = 'names_bold' } = request.body as any;
    
    try {
      const payload = generateMockAggregationPayload('demo-project-1', 24);
      payload.mention_policy = mention_policy;
      
      const composed = await composeStandup(payload);
      
      return {
        message: 'Demo composition test',
        input_policy: mention_policy,
        composition: composed,
        preview: composed.post_text,
        metrics: composed.metrics
      };
    } catch (error: any) {
      fastify.log.error('Demo composition test failed:', error);
      reply.code(500).send({ error: error.message });
    }
  });
}