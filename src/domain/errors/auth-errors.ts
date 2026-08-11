// A machine-readable reason, not just a boolean — same idea as `canReviewBooking` in Cerca.md.
// The screen maps this to `t('auth.error.${reason}')`; the domain never picks the wording.
export type SignInFailureReason = 'invalid_credentials' | 'network_error' | 'unexpected_error';

export class SignInError extends Error {
  constructor(readonly reason: SignInFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'SignInError';
  }
}

export type SignUpFailureReason = 'email_taken' | 'network_error' | 'unexpected_error';

export class SignUpError extends Error {
  constructor(readonly reason: SignUpFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'SignUpError';
  }
}
