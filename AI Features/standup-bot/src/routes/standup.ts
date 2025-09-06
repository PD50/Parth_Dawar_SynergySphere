import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
// import { PrismaClient } from '@prisma/client';
import { aggregateProjectHealth } from '../services/aggregation.js';
import { composeStandup } from '../services/composition.js';
import { postToSlack, SlackConfig } from '../services/poster/slack.js';
import { PgMutex } from '../services/mutex.js';

// const prisma = new PrismaClient();

import { prisma } from "../db.js";

const PreviewQuerySchema = z.object({
  projectId: z.string(),
  hours: z.coerce.number().int().min(24).max(48).default(24)
});

const GenerateBodySchema = z.object({
  projectId: z.string(),
  hours: z.number().int().min(24).max(48).optional().default(24),
  force: z.boolean().optional().default(false)
});

const LastQuerySchema = z.object({
  projectId: z.string()
});

export async function standupRoutes(fastify: FastifyInstance) {
  fastify.get('/api/standup/preview', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = PreviewQuerySchema.parse(request.query);
    
    try {
      const payload = await aggregateProjectHealth(query.projectId, query.hours as 24 | 48);
      const composed = await composeStandup(payload);
      
      const lastPost = await prisma.standupPost.findFirst({
        where: { project_id: query.projectId },
        orderBy: { posted_at: 'desc' }
      });

      return {
        payload,
        composed,
        last_post: lastPost ? {
          id: lastPost.id,
          posted_at: lastPost.posted_at,
          window_hours: lastPost.window_hours,
          payload_hash: lastPost.payload_hash
        } : null
      };
    } catch (error: any) {
      fastify.log.error('Preview failed:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  fastify.post('/api/standup/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = GenerateBodySchema.parse(request.body);
    
    const mutex = PgMutex.forProject(body.projectId);
    
    const result = await mutex.withLock(async () => {
      try {
        const payload = await aggregateProjectHealth(body.projectId, body.hours as 24 | 48);
        
        if (!body.force) {
          const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
          const recentPost = await prisma.standupPost.findFirst({
            where: {
              project_id: body.projectId,
              payload_hash: payload.payload_hash,
              posted_at: { gte: sixHoursAgo }
            }
          });

          if (recentPost) {
            reply.code(304);
            return { status: 'noop', message: 'Identical post already exists within 6 hours' };
          }
        }

        if (payload.business_calendar.skip_post_today) {
          return { status: 'skipped', message: 'Skipping non-business day' };
        }

        const composed = await composeStandup(payload);

        const project = await prisma.project.findUnique({
          where: { id: body.projectId }
        });

        if (!project) {
          throw new Error('Project not found');
        }

        const slackConfig: SlackConfig = {
          mode: project.slack_mode as 'webhook' | 'bot',
          webhook_url: project.slack_webhook_url || undefined,
          bot_token: project.slack_bot_token || undefined,
          channel_id: project.slack_channel_id || undefined
        };

        const postResult = await postToSlack(composed, slackConfig);
        
        if (!postResult.success) {
          throw new Error(`Slack posting failed: ${postResult.error}`);
        }

        const standupPost = await prisma.standupPost.create({
          data: {
            project_id: body.projectId,
            window_hours: payload.window_hours,
            window_start: new Date(payload.window_start),
            window_end: new Date(payload.window_end),
            payload_hash: payload.payload_hash,
            body: composed.post_text
          }
        });

        fastify.log.info(
          {
            project_id: body.projectId,
            post_id: standupPost.id,
            payload_hash: payload.payload_hash,
            composition_method: composed.metrics.composition_method
          },
          'Stand-up generated successfully'
        );

        return {
          status: 'posted',
          post_id: standupPost.id,
          payload_hash: payload.payload_hash,
          composition_method: composed.metrics.composition_method,
          slack_ts: postResult.ts
        };
      } catch (error: any) {
        fastify.log.error('Generation failed:', error);
        throw error;
      }
    }, 30000);

    if (result === null) {
      reply.code(409).send({ error: 'Could not acquire project lock' });
      return;
    }

    return result;
  });

  fastify.get('/api/standup/last', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = LastQuerySchema.parse(request.query);

    try {
      const lastPost = await prisma.standupPost.findFirst({
        where: { project_id: query.projectId },
        orderBy: { posted_at: 'desc' },
        include: {
          project: {
            select: { name: true }
          }
        }
      });

      if (!lastPost) {
        reply.code(404).send({ error: 'No posts found for this project' });
        return;
      }

      return {
        id: lastPost.id,
        project: lastPost.project.name,
        window_hours: lastPost.window_hours,
        window_start: lastPost.window_start,
        window_end: lastPost.window_end,
        payload_hash: lastPost.payload_hash,
        body: lastPost.body,
        posted_at: lastPost.posted_at
      };
    } catch (error: any) {
      fastify.log.error('Last post retrieval failed:', error);
      return reply.code(500).send({ error: error.message });
    }
  });
}