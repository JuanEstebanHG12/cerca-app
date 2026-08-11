import { Session } from '../../domain/models/session';

// Port: the application only knows it can "sign in" and get a Session back, or that the
// promise rejects with a domain SignInError. It has no idea this is HTTP, what the base URL
// is, or that the response is validated with zod — that all lives behind the implementation
// in src/infrastructure/api, which is what Dependency Inversion buys us here.
export interface AuthGateway {
  signIn(email: string, password: string): Promise<Session>;
  // Capacities aren't collected at sign-up: everyone starts as a customer, and becoming a
  // provider is an in-app action later (Cerca.md, "hacerse proveedora es una acción dentro
  // de la app, no un registro distinto") — so the gateway doesn't even take the parameter.
  signUp(email: string, password: string, displayName: string): Promise<Session>;
  signOut(refreshToken: string): Promise<void>;
}
