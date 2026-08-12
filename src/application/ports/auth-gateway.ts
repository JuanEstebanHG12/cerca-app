import { Actor } from '../../domain/models/actor';
import { Session } from '../../domain/models/session';

// Port: the application only knows it can "sign in" and get a Session back, or that the
// promise rejects with a domain SignInError. It has no idea this is HTTP, what the base URL
// is, or that the response is validated with zod — that all lives behind the implementation
// in src/infrastructure/api, which is what Dependency Inversion buys us here.
export interface AuthGateway {
  signIn(email: string, password: string): Promise<Session>;
  // Capacities aren't collected at sign-up: everyone starts as a customer, and becoming a
  // provider is an in-app action later (Cerca.md, "hacerse proveedora es una acción dentro
  // de la app, no un registro distinto") — this is that action.
  signUp(email: string, password: string, displayName: string): Promise<Session>;
  signOut(refreshToken: string): Promise<void>;
  becomeProvider(accessToken: string): Promise<Actor>;
  // Capacities are baked into the access token's claims at issue time — granting one
  // server-side doesn't retroactively update a token already handed out. This is what makes a
  // freshly-granted capacity actually usable in the same session, not just on the next sign-in.
  refresh(refreshToken: string): Promise<Session>;
}
