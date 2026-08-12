import { z } from 'zod';

export const createReportRequestSchema = z.object({
  reason: z.string().min(3).max(500),
});
export type CreateReportApiRequestDto = z.infer<typeof createReportRequestSchema>;

export const resolveReportRequestSchema = z.object({
  action: z.enum(['remove', 'dismiss']),
  note: z.string().max(500).optional(),
});
export type ResolveReportApiRequestDto = z.infer<typeof resolveReportRequestSchema>;
