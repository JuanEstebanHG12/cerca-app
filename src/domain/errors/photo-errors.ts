// 'not_available' is its own reason, not folded into 'unexpected_error': as of this writing
// `POST /listings/{id}/photos:presign` isn't implemented in cerca-api yet (verified directly —
// no route, no use-case, nothing in @cerca/contract), so every presign call 404s today. That's
// a distinct, expected condition — "the feature isn't live server-side" — not a bug in this
// app, and the UI needs to tell the two apart to word the message honestly.
export type PhotoUploadFailureReason = 'not_available' | 'forbidden' | 'network_error' | 'unexpected_error';

export class PhotoUploadError extends Error {
  constructor(readonly reason: PhotoUploadFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'PhotoUploadError';
  }
}
