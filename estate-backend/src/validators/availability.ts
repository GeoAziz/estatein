import { z } from 'zod';

export const CreateAvailabilitySchema = z.object({
  slots: z.array(
    z.object({
      date: z.string().datetime(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
    })
  ).min(1),
});

export const GetAvailabilitySchema = z.object({
  agentId: z.string(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const DeleteAvailabilitySchema = z.object({
  id: z.string(),
});

export type CreateAvailability = z.infer<typeof CreateAvailabilitySchema>;
export type GetAvailability = z.infer<typeof GetAvailabilitySchema>;
export type DeleteAvailability = z.infer<typeof DeleteAvailabilitySchema>;
