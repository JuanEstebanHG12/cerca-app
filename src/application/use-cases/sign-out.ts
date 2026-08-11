import { AuthGateway } from '../ports/auth-gateway';
import { SessionStorage } from '../ports/session-storage';

// Signing out has to work in a metro tunnel with no signal, so the local session is cleared
// unconditionally. Telling the server is best-effort: if that call fails, the user is still
// signed out on this device, which is the part they actually asked for.
export class SignOutUseCase {
  constructor(
    private readonly authGateway: AuthGateway,
    private readonly sessionStorage: SessionStorage,
  ) {}

  async execute(): Promise<void> {
    const session = await this.sessionStorage.load();
    if (session) {
      await this.authGateway.signOut(session.refreshToken).catch(() => undefined);
    }
    await this.sessionStorage.clear();
  }
}
