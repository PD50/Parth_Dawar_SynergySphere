import fastify from 'fastify';
import cors from '@fastify/cors';
import { standupRoutes } from './routes/standup.js';
import { demoRoutes } from './routes/demo.js';
import { integrationRoutes } from './routes/integration.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { metricsRoutes } from './middleware/metrics.js';
import { initializeScheduler } from './cron/scheduler.js';

import 'dotenv/config';

const app = fastify({ 
  logger: {
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Register CORS for web app integration
await app.register(cors, {
  origin: (origin, cb) => {
    const hostname = new URL(origin || 'http://localhost:3000').hostname;
    // Allow localhost for development and your web app domain
    if(hostname === 'localhost' || hostname === '127.0.0.1' || process.env.ALLOWED_ORIGINS?.includes(origin || '')) {
      cb(null, true);
      return;
    }
    cb(new Error("Not allowed"), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

/** Health first, no auth */
app.get('/healthz', async () => ({ ok: true, ts: new Date().toISOString() }));

/** Auth hook AFTER healthz */
app.addHook('onRequest', async (req, reply) => {
  if (req.url === '/healthz') return;
  return createAuthMiddleware(process.env.API_KEY || 'dev-local-key')(req, reply);
});

// Register routes
await app.register(standupRoutes);
await app.register(demoRoutes);
await app.register(integrationRoutes);
await app.register(metricsRoutes);

// Initialize scheduler
initializeScheduler();

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST || '127.0.0.1';

await app.listen({ port: PORT, host: HOST });
app.log.info(`Server listening at http://${HOST}:${PORT}`);
console.log(`Server listening at http://${HOST}:${PORT}`);