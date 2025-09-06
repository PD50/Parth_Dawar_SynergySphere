import fastify from 'fastify';
import { standupRoutes } from '../../routes/standup.js';
import { createAuthMiddleware } from '../../middleware/auth.js';
import { metricsRoutes } from '../../middleware/metrics.js';

export function build() {
  const app = fastify({
    logger: false
  });

  app.addHook('onRequest', createAuthMiddleware('dev-local-key'));

  app.get('/healthz', async () => {
    return { ok: true, timestamp: new Date().toISOString() };
  });

  app.register(standupRoutes);
  app.register(metricsRoutes);

  app.setErrorHandler(async (error, request, reply) => {
    if (error.validation) {
      reply.status(400).send({
        error: 'Validation failed',
        details: error.validation
      });
      return;
    }
    
    reply.status(500).send({
      error: 'Internal server error'
    });
  });

  return app;
}