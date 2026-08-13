import { z } from 'zod';
import { actorSchema } from './actor';

// The one secret this app ever handles (see Cerca.md: "en el móvil no hay secretos").
// It lives only in secure storage, never in AsyncStorage or app state that could be logged.
export const sessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  actor: actorSchema,
});
export type Session = z.infer<typeof sessionSchema>;

// What actually gets saved to disk. `email` isn't part of `sessionSchema` because the server
// never sends it back — not at sign-in, not at GET /me (verified directly: both only return
// {accessToken, refreshToken, actor} / {id, capacities, platformRole}). The only moment the app
// ever sees an account's email is when someone types it into the sign-in/sign-up form, so that's
// where it has to be captured (see sign-in.ts/sign-up.ts) and carried forward by hand through
// every later `save()` (see become-provider.ts) — the server can't give it back to us.
export const storedSessionSchema = sessionSchema.extend({ email: z.string() });
export type StoredSession = z.infer<typeof storedSessionSchema>;
