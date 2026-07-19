import { Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

/**
 * Create availability slots for an agent (bulk operation).
 */
export async function createSlots(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 401, 'UNAUTHORIZED', 'User not authenticated');
    }

    // Check that user is an agent
    const agent = await prisma.agent.findUnique({
      where: { userId },
    });

    if (!agent) {
      return sendError(res, 403, 'FORBIDDEN', 'User is not an agent');
    }

    const { slots } = req.body;
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return sendError(res, 400, 'BAD_REQUEST', 'Invalid slots array');
    }

    // Create slots
    const createdSlots = await Promise.all(
      slots.map(slot =>
        prisma.agentAvailabilitySlot.create({
          data: {
            agentId: agent.id,
            date: new Date(slot.date),
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
        })
      )
    );

    return sendSuccess(res, { slots: createdSlots, count: createdSlots.length }, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Get availability slots for an agent (public endpoint).
 */
export async function getSlots(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const agentId = req.params.agentId as string;
    const { from, to } = req.query;

    if (!agentId) {
      return sendError(res, 400, 'BAD_REQUEST', 'Missing agentId parameter');
    }

    // Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return sendError(res, 404, 'NOT_FOUND', 'Agent not found');
    }

    const whereClause: any = {
      agentId,
      isBooked: false,
    };

    if (from || to) {
      whereClause.date = {};
      const fromStr = typeof from === 'string' ? from : Array.isArray(from) ? (from[0] as string) : undefined;
      const toStr = typeof to === 'string' ? to : Array.isArray(to) ? (to[0] as string) : undefined;
      if (fromStr) whereClause.date.gte = new Date(fromStr as string);
      if (toStr) whereClause.date.lte = new Date(toStr as string);
    }

    const slots = await prisma.agentAvailabilitySlot.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
    });

    return sendSuccess(res, { slots, count: slots.length });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an availability slot (owner agent only).
 */
export async function deleteSlot(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 401, 'UNAUTHORIZED', 'User not authenticated');
    }

    const id = req.params.id as string;
    if (!id) {
      return sendError(res, 400, 'BAD_REQUEST', 'Missing slot id parameter');
    }

    const slot = await prisma.agentAvailabilitySlot.findUnique({
      where: { id },
    });

    if (!slot) {
      return sendError(res, 404, 'NOT_FOUND', 'Slot not found');
    }

    // Get agent to verify ownership
    const agent = await prisma.agent.findUnique({
      where: { id: slot.agentId },
    });

    if (!agent || agent.userId !== userId) {
      return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to delete this slot');
    }

    // Prevent deletion if slot is booked
    if (slot.isBooked) {
      return sendError(res, 400, 'BAD_REQUEST', 'Cannot delete a booked slot');
    }

    await prisma.agentAvailabilitySlot.delete({
      where: { id },
    });

    return sendSuccess(res, { message: 'Slot deleted successfully' });
  } catch (error) {
    next(error);
  }
}
