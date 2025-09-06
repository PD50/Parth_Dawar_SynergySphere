import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { verifyAuth } from "@/lib/middleware/auth";

const prisma = new PrismaClient();

const batchUpdateSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string(),
      status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
      assigneeId: z.string().optional(),
    })
  ),
});

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await req.json();
    const { updates } = batchUpdateSchema.parse(body);

    const taskIds = updates.map((update) => update.id);

    // Verify user has access to all tasks
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        project: {
          members: {
            some: {
              userId: authResult.userId,
            },
          },
        },
      },
    });

    if (tasks.length !== taskIds.length) {
      return NextResponse.json(
        { error: "Some tasks not found or access denied" },
        { status: 404 }
      );
    }

    // Perform batch updates
    const updatePromises = updates.map((update) => {
      const updateData: any = {};
      if (update.status) updateData.status = update.status;
      if (update.priority) updateData.priority = update.priority;
      if (update.assigneeId !== undefined) updateData.assigneeId = update.assigneeId;
      updateData.updatedAt = new Date();

      return prisma.task.update({
        where: { id: update.id },
        data: updateData,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    const updatedTasks = await Promise.all(updatePromises);

    return NextResponse.json({ tasks: updatedTasks });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Batch update tasks error:", error);
    return NextResponse.json(
      { error: "Failed to update tasks" },
      { status: 500 }
    );
  }
}