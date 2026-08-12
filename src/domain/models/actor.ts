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

// Mirrors the backend's `has(actor, capacity)` (@cerca/contract, auth/actor.ts). This is a UX
// check only — it decides whether the app shows the "publish a listing" entry point, never
// whether the request succeeds. The server re-checks `listing:create` on every `POST
// /listings` regardless of what this returns (Cerca.md: "el cliente nunca sustituye [la
// autoridad del servidor], la refleja").
export function hasCapacity(actor: Actor, capacity: Capacity): boolean {
  return actor.capacities.includes(capacity);
}
