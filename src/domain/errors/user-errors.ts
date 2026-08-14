// POST /users/:id/suspend requires 'user:suspend' (admin only, PolicyGuard) — confirmed by
// reading cerca-api's users.controller.ts and policy.guard.ts directly, not assumed. 403 carries
// reason 'no_capacity' (same shape PolicyGuard uses everywhere else); 404 is
// SuspendUserUseCase's own USER_NOT_FOUND, thrown before anything is written.
export type SuspendUserFailureReason = 'no_capacity' | 'not_found' | 'network_error' | 'unexpected_error';

export class SuspendUserError extends Error {
  constructor(readonly reason: SuspendUserFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'SuspendUserError';
  }
}
