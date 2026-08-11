import { Actor } from '../../domain/models/actor';
import { SignUpError, SignUpFailureReason } from '../../domain/errors/auth-errors';
import { AuthGateway } from '../ports/auth-gateway';
import { SessionStorage } from '../ports/session-storage';

export type SignUpResult = { ok: true; actor: Actor } | { ok: false; reason: SignUpFailureReason };

export class SignUpUseCase {
  constructor(
    private readonly authGateway: AuthGateway,
    private readonly sessionStorage: SessionStorage,
  ) {}

  async execute(email: string, password: string, displayName: string): Promise<SignUpResult> {
    try {
      const session = await this.authGateway.signUp(email, password, displayName);
      // Same as sign-in: persist before returning "ok", so a freshly created account already
      // survives a restart instead of needing a second sign-in to actually stick.
      await this.sessionStorage.save(session);
      return { ok: true, actor: session.actor };
    } catch (error) {
      if (error instanceof SignUpError) {
        return { ok: false, reason: error.reason };
      }
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
