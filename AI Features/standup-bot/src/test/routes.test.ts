import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from './helpers/app.js';
import { FastifyInstance } from 'fastify';

describe('API Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = build();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/healthz',
      headers: {
        'x-api-key': 'dev-local-key'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.ok).toBe(true);
    expect(body.timestamp).toBeDefined();
  });

  it('should require API key for protected routes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/standup/preview?projectId=test'
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Missing X-API-Key');
  });

  it('should reject invalid API key', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/standup/preview?projectId=test',
      headers: {
        'x-api-key': 'invalid-key'
      }
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Invalid API key');
  });

  it('should validate query parameters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/standup/preview',
      headers: {
        'x-api-key': 'dev-local-key'
      }
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return metrics in Prometheus format', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/metrics',
      headers: {
        'x-api-key': 'dev-local-key'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
    expect(response.body).toContain('# HELP');
    expect(response.body).toContain('# TYPE');
    expect(response.body).toContain('agg_latency_ms');
    expect(response.body).toContain('llm_failures_total');
  });
});