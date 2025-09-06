import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';

export function createAuthMiddleware(apiKey: string) {
  return async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const providedKey = request.headers['x-api-key'];
    
    if (!providedKey || typeof providedKey !== 'string') {
      reply.code(401).send({ error: 'Missing X-API-Key header' });
      return;
    }

    const expectedHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const providedHash = crypto.createHash('sha256').update(providedKey).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(providedHash))) {
      reply.code(401).send({ error: 'Invalid API key' });
      return;
    }
  };
}