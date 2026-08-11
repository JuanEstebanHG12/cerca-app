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
