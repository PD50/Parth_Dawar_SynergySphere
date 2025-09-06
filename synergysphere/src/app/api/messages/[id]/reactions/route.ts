import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const messageId = params.id;
    const body = await req.json();
    const { emoji } = body;

    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }

    // Verify the message exists and user has access to it
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        project: {
          select: { id: true },
        },
      },
    });

    if (!message || message.deletedAt) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify user has access to the project
    const membership = await prisma.membership.findFirst({
      where: {
        projectId: message.projectId,
        userId: authResult.userId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this message' },
        { status: 403 }
      );
    }

    // Check if user already reacted with this emoji
    const existingReaction = await prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId: authResult.userId,
        emoji,
      },
    });

    if (existingReaction) {
      // Remove the reaction (toggle off)
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      });
      
      return NextResponse.json({ removed: true });
    } else {
      // Add the reaction
      const reaction = await prisma.messageReaction.create({
        data: {
          messageId,
          userId: authResult.userId,
          emoji,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const transformedReaction = {
        id: reaction.id,
        emoji: reaction.emoji,
        userId: reaction.userId,
        userName: reaction.user.name,
        createdAt: reaction.createdAt,
      };

      return NextResponse.json({ reaction: transformedReaction });
    }
  } catch (error) {
    console.error('Failed to toggle reaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const messageId = params.id;

    // Verify the message exists and user has access to it
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { projectId: true, deletedAt: true },
    });

    if (!message || message.deletedAt) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify user has access to the project
    const membership = await prisma.membership.findFirst({
      where: {
        projectId: message.projectId,
        userId: authResult.userId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this message' },
        { status: 403 }
      );
    }

    // Get all reactions for this message
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const transformedReactions = reactions.map((reaction) => ({
      id: reaction.id,
      emoji: reaction.emoji,
      userId: reaction.userId,
      userName: reaction.user.name,
      createdAt: reaction.createdAt,
    }));

    return NextResponse.json({ reactions: transformedReactions });
  } catch (error) {
    console.error('Failed to get reactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}