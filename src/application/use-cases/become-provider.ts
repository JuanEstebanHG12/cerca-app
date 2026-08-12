import { Actor } from '../../domain/models/actor';
import { BecomeProviderError, BecomeProviderFailureReason } from '../../domain/errors/auth-errors';
import { AuthGateway } from '../ports/auth-gateway';
import { SessionStorage } from '../ports/session-storage';

export type BecomeProviderResult = { ok: true; actor: Actor } | { ok: false; reason: BecomeProviderFailureReason };

// Only callable while signed in (the publish flow gates on this), so a missing session here
// is a programming error, not a user-facing outcome — it surfaces as `unexpected_error`
// rather than its own reason.
export class BecomeProviderUseCase {
  constructor(
    private readonly authGateway: AuthGateway,
    private readonly sessionStorage: SessionStorage,
  ) {}

  async execute(): Promise<BecomeProviderResult> {
    const session = await this.sessionStorage.load();
    if (!session) return { ok: false, reason: 'unexpected_error' };

    try {
      await this.authGateway.becomeProvider(session.accessToken);
      // Grant it server-side, then refresh: capacities are baked into the access token at
      // issue time, so the token just used above is now stale — without this, the very next
      // call (POST /listings) would still 403 with "listing:create" missing, even though the
      // server just granted it. `refresh` re-reads the user and issues a token that carries
      // the new capacity, which is also what needs to survive a restart.
      const refreshed = await this.authGateway.refresh(session.refreshToken);
      await this.sessionStorage.save(refreshed);
      return { ok: true, actor: refreshed.actor };
    } catch (error) {
      if (error instanceof BecomeProviderError) {
        return { ok: false, reason: error.reason };
      }
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
