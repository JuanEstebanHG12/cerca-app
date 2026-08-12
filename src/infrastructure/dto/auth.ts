import { z } from 'zod';
import { capacitySchema } from '../../domain/models/actor';

export const signUpRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(200),
  displayName: z.string().min(1).max(120),
  capacities: z.array(capacitySchema).min(1).max(2).default(['customer']).optional(),
});
export type SignUpApiRequestDto = z.infer<typeof signUpRequestSchema>;

export const signInRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
});
export type SignInApiRequestDto = z.infer<typeof signInRequestSchema>;

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshApiRequestDto = z.infer<typeof refreshRequestSchema>;

export const signOutRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export type SignOutApiRequestDto = z.infer<typeof signOutRequestSchema>;
