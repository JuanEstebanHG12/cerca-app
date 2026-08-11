import { z } from 'zod';

// Mirrors the backend contract exactly (packages/contract/src/auth/actor.ts in cerca-api).
// A single account can hold both capacities at once — there is no 'role' field that mixes
// capacities with platform role, or Marta (customer + provider) would not fit.
export const capacitySchema = z.enum(['customer', 'provider']);
export type Capacity = z.infer<typeof capacitySchema>;

export const platformRoleSchema = z.enum(['user', 'moderator', 'admin']);
export type PlatformRole = z.infer<typeof platformRoleSchema>;

// What the server sends back after sign-in/refresh, and what GET /me returns.
export const actorSchema = z.object({
  id: z.uuid(),
  capacities: z.array(capacitySchema),
  platformRole: platformRoleSchema,
});
export type Actor = z.infer<typeof actorSchema>;
