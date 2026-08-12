import { z } from 'zod';

export const writeReviewRequestSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(1).max(2000),
});
export type WriteReviewApiRequestDto = z.infer<typeof writeReviewRequestSchema>;

export const moderateReviewRequestSchema = z.object({
  action: z.enum(['remove', 'keep']),
  reason: z.string().max(500).optional(),
});
export type ModerateReviewApiRequestDto = z.infer<typeof moderateReviewRequestSchema>;
