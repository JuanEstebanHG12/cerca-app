import { Actor } from '../../domain/models/actor';
import { SignInError, SignInFailureReason } from '../../domain/errors/auth-errors';
import { AuthGateway } from '../ports/auth-gateway';
import { SessionStorage } from '../ports/session-storage';

// Result type instead of a boolean or a thrown exception: a wrong password is an expected
// outcome of signing in, not a bug, so the screen needs the *reason* to show the right
// message — same shape as `canReviewBooking` in Cerca.md.
export type SignInResult = { ok: true; actor: Actor } | { ok: false; reason: SignInFailureReason };

export class SignInUseCase {
  constructor(
    private readonly authGateway: AuthGateway,
    private readonly sessionStorage: SessionStorage,
  ) {}

  async execute(email: string, password: string): Promise<SignInResult> {
    try {
      const session = await this.authGateway.signIn(email, password);
      // Persist before returning: by the time the UI sees `ok: true`, the session already
      // survives a restart. Nothing about "logged in" is true until it's on disk.
      await this.sessionStorage.save(session);
      return { ok: true, actor: session.actor };
    } catch (error) {
      if (error instanceof SignInError) {
        return { ok: false, reason: error.reason };
      }
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
