import { UserGateway } from '../../application/ports/user-gateway';
import { SuspendUserError } from '../../domain/errors/user-errors';
import { ApiError, NetworkError } from './api-errors';
import { httpClient } from './http-client';

export class UserApiGateway implements UserGateway {
  // 204 No Content on success (users.controller.ts) — httpClient.post already returns
  // `undefined` for a 204 body, so this resolves to void with nothing further to parse.
  async suspend(userId: string, accessToken: string): Promise<void> {
    try {
      await httpClient.post<void>(`/users/${userId}/suspend`, {}, accessToken);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) throw new SuspendUserError('no_capacity', error.message);
        if (error.status === 404) throw new SuspendUserError('not_found', error.message);
        throw new SuspendUserError('unexpected_error', error.message);
      }
      if (error instanceof NetworkError) throw new SuspendUserError('network_error', error.message);
      throw new SuspendUserError('unexpected_error', error instanceof Error ? error.message : undefined);
    }
  }
}
