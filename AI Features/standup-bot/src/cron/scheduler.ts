import cron from 'node-cron';
// import { PrismaClient } from '@prisma/client';
import { PgMutex } from '../services/mutex.js';
import fetch from 'node-fetch';

import { prisma } from "../db.js";

// const prisma = new PrismaClient();

export function initializeScheduler() {
  cron.schedule('0 */15 * * * *', async () => {
    await scheduleStandups();
  });
  
  console.log('Scheduler initialized - checking for standups every 15 minutes');
}

async function scheduleStandups() {
  try {
    const projects = await prisma.project.findMany({
      where: {
        business_days_only: true
      }
    });

    const now = new Date();

    for (const project of projects) {
      try {
        const projectLocalTime = convertToProjectTime(now, project.timezone);
        const shouldRunStandup = checkIfStandupTime(projectLocalTime, project.business_days_only);

        if (shouldRunStandup) {
          const mutex = PgMutex.forProject(project.id);
          
          const result = await mutex.withLock(async () => {
            const today = new Date().toISOString().split('T')[0];
            const existingPost = await prisma.standupPost.findFirst({
              where: {
                project_id: project.id,
                posted_at: {
                  gte: new Date(`${today}T00:00:00Z`),
                  lt: new Date(`${today}T23:59:59Z`)
                }
              }
            });

            if (existingPost) {
              console.log(`Standup already posted today for project ${project.name}`);
              return 'already_posted';
            }

            return await generateStandup(project.id);
          }, 5000);

          if (result === null) {
            console.warn(`Could not acquire lock for project ${project.name}`);
          }
        }
      } catch (error) {
        console.error(`Failed to process project ${project.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Scheduler error:', error);
  }
}

function convertToProjectTime(utcDate: Date, timezone: string): Date {
  try {
    return new Date(utcDate.toLocaleString("en-US", { timeZone: timezone }));
  } catch (error) {
    console.warn(`Invalid timezone ${timezone}, using UTC`);
    return utcDate;
  }
}

function checkIfStandupTime(localTime: Date, businessDaysOnly: boolean): boolean {
  const hour = localTime.getHours();
  const minute = localTime.getMinutes();
  const dayOfWeek = localTime.getDay();

  if (businessDaysOnly && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return false;
  }

  return hour === 9 && minute >= 0 && minute < 15;
}

async function generateStandup(projectId: string): Promise<string> {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API_KEY not configured');
    }

    const response = await fetch('http://localhost:3000/api/standup/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        projectId,
        hours: 24
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} ${errorText}`);
    }

    const result: any = await response.json();
    console.log(`Scheduled standup generated for project ${projectId}: ${result.status}`);
    
    return result.status;
  } catch (error) {
    console.error(`Failed to generate standup for project ${projectId}:`, error);
    throw error;
  }
}