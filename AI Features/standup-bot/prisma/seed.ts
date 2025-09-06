import { PrismaClient } from "@prisma/client";
import process from "process";
const prisma = new PrismaClient();

async function main() {
  const proj = await prisma.project.upsert({
    where: { id: "proj_1" },
    update: {},
    create: {
      id: "proj_1",
      name: "Launch Alpha",
      timezone: "Asia/Kolkata",
      business_days_only: true,
      slack_mode: "webhook",
    },
  });

  const [vikram, nina, arun] = await prisma.$transaction([
    prisma.user.upsert({
      where: { email: "vikram@example.com" },
      update: {},
      create: { id: "u_vikram", name: "Vikram", email: "vikram@example.com", capacity_score: 0.9 },
    }),
    prisma.user.upsert({
      where: { email: "nina@example.com" },
      update: {},
      create: { id: "u_nina", name: "Nina", email: "nina@example.com", capacity_score: 0.8 },
    }),
    prisma.user.upsert({
      where: { email: "arun@example.com" },
      update: {},
      create: { id: "u_arun", name: "Arun", email: "arun@example.com", capacity_score: 0.7 },
    }),
  ]);

  const now = new Date();
  const h = (n: number) => new Date(now.getTime() + n * 3600000);

  await prisma.task.upsert({
    where: { id: "T-19" },
    update: {},
    create: {
      id: "T-19",
      project_id: proj.id,
      title: "Invoice export edge cases",
      status: "In Progress",
      status_category: "doing",
      priority: 3,
      assignee_id: null,
      due_at: h(-12), // overdue
      updated_at: h(-2),
      created_at: h(-120),
    },
  });

  await prisma.task.upsert({
    where: { id: "T-27" },
    update: {},
    create: {
      id: "T-27",
      project_id: proj.id,
      title: "Auth rate limits",
      status: "To-Do",
      status_category: "todo",
      priority: 2,
      assignee_id: nina.id,
      due_at: h(36), // due soon
      updated_at: h(-5),
      created_at: h(-200),
    },
  });

  await prisma.task.upsert({
    where: { id: "T-33" },
    update: {},
    create: {
      id: "T-33",
      project_id: proj.id,
      title: "QA test scope for onboarding",
      status: "Done",
      status_category: "done",
      priority: 1,
      assignee_id: arun.id,
      due_at: h(72),
      updated_at: h(-8),
      created_at: h(-180),
    },
  });

  await prisma.taskActivity.upsert({
    where: { id: "a1" },
    update: {},
    create: {
      id: "a1",
      project_id: proj.id,
      task_id: "T-33",
      from_status: "In Progress",
      to_status: "Done",
      at: h(-10),
      actor_id: arun.id,
    },
  });

  await prisma.taskActivity.upsert({
    where: { id: "a2" },
    update: {},
    create: {
      id: "a2",
      project_id: proj.id,
      task_id: "T-19",
      from_status: "To-Do",
      to_status: "In Progress",
      at: h(-20),
      actor_id: vikram.id,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
