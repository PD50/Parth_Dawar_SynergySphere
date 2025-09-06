import { prisma } from "../db.js";

// SQLite-compatible mutex using a database table for locking
export class SqliteMutex {
  private lockKey: string;

  constructor(lockKey: string) {
    this.lockKey = lockKey;
  }

  static forProject(projectId: string): SqliteMutex {
    return new SqliteMutex(`project:${projectId}`);
  }

  async acquire(timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    const expiresAt = new Date(Date.now() + timeoutMs);

    while (Date.now() - startTime < timeoutMs) {
      try {
        // Clean up expired locks first
        await SqliteMutex.cleanup();

        // Try to create a lock record
        await prisma.mutexLock.create({
          data: {
            lock_key: this.lockKey,
            expires_at: expiresAt
          }
        }).catch(() => {}); // Ignore unique constraint errors

        // Check if we got the lock
        const existingLock = await prisma.mutexLock.findUnique({
          where: { lock_key: this.lockKey }
        });

        if (existingLock && existingLock.expires_at > new Date()) {
          return true;
        }

        // Wait before retrying
        await sleep(100);
      } catch (error) {
        console.warn('Mutex acquire attempt failed:', error);
        await sleep(100);
      }
    }

    return false;
  }

  async release(): Promise<void> {
    try {
      await prisma.mutexLock.delete({
        where: { lock_key: this.lockKey }
      }).catch(() => {}); // Ignore if lock doesn't exist
    } catch (error) {
      console.error('Failed to release mutex:', error);
    }
  }

  async withLock<T>(fn: () => Promise<T>, timeoutMs: number = 30000): Promise<T | null> {
    const acquired = await this.acquire(timeoutMs);
    if (!acquired) {
      return null;
    }

    try {
      return await fn();
    } finally {
      await this.release();
    }
  }

  // Cleanup expired locks
  static async cleanup(): Promise<void> {
    try {
      await prisma.mutexLock.deleteMany({
        where: {
          expires_at: {
            lte: new Date()
          }
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup expired locks:', error);
    }
  }
}

// Alias for backward compatibility
export const PgMutex = SqliteMutex;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}