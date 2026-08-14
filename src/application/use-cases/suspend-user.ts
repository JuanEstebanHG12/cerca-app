import { SuspendUserError, SuspendUserFailureReason } from '../../domain/errors/user-errors';
import { UserGateway } from '../ports/user-gateway';

export type SuspendUserResult = { ok: true } | { ok: false; reason: SuspendUserFailureReason };

export class SuspendUserUseCase {
  constructor(private readonly userGateway: UserGateway) {}

  async execute(userId: string, accessToken: string): Promise<SuspendUserResult> {
    try {
      await this.userGateway.suspend(userId, accessToken);
      return { ok: true };
    } catch (error) {
      if (error instanceof SuspendUserError) return { ok: false, reason: error.reason };
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
