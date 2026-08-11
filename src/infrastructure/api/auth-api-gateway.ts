import { AuthGateway } from '../../application/ports/auth-gateway';
import { SignInError, SignUpError } from '../../domain/errors/auth-errors';
import { Session, sessionSchema } from '../../domain/models/session';
import { ApiError, NetworkError } from './api-errors';
import { httpClient } from './http-client';

// Implements the AuthGateway port with real HTTP calls to the Cerca API. This is the only
// place in the app that knows the auth endpoints exist, and the only place that turns raw
// JSON into a trusted Session.
export class AuthApiGateway implements AuthGateway {
  async signIn(email: string, password: string): Promise<Session> {
    try {
      const raw = await httpClient.post<unknown>('/auth/sign-in', { email, password });
      // `parse`, never `as`: if the backend renames a field, this throws here with a clear
      // message instead of shipping `undefined` three screens later (Cerca.md, "el límite
      // con la red se valida, no se promete").
      return sessionSchema.parse(raw);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new SignInError('invalid_credentials', error.message);
      }
      if (error instanceof NetworkError) {
        throw new SignInError('network_error', error.message);
      }
      throw new SignInError('unexpected_error', error instanceof Error ? error.message : undefined);
    }
  }

  async signUp(email: string, password: string, displayName: string): Promise<Session> {
    try {
      const raw = await httpClient.post<unknown>('/auth/sign-up', { email, password, displayName });
      return sessionSchema.parse(raw);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && error.code === 'EMAIL_TAKEN') {
        throw new SignUpError('email_taken', error.message);
      }
      if (error instanceof NetworkError) {
        throw new SignUpError('network_error', error.message);
      }
      throw new SignUpError('unexpected_error', error instanceof Error ? error.message : undefined);
    }
  }

  async signOut(refreshToken: string): Promise<void> {
    await httpClient.post<void>('/auth/sign-out', { refreshToken });
  }
}
