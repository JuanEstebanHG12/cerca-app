import { PhotoGateway } from '../../application/ports/photo-gateway';
import { PhotoUploadError } from '../../domain/errors/photo-errors';
import { photoUploadTargetSchema, PhotoUploadTarget } from '../../domain/models/listing-photo';
import { ApiError, NetworkError } from './api-errors';
import { httpClient } from './http-client';

// Implements the port against the endpoint Cerca.md's API table documents
// (`POST /listings/{id}/photos:presign`) — not against what's actually deployed. As of this
// writing that route doesn't exist in cerca-api (no controller, no use-case, nothing in
// @cerca/contract), so every call here 404s and toPhotoUploadError maps that to
// 'not_available'. This file is deliberately the *only* place that has to change once the
// backend ships it.
export class PhotoApiGateway implements PhotoGateway {
  async presign(listingId: string, accessToken: string): Promise<PhotoUploadTarget> {
    try {
      const raw = await httpClient.post<unknown>(`/listings/${listingId}/photos:presign`, undefined, accessToken);
      return photoUploadTargetSchema.parse(raw);
    } catch (error) {
      throw toPhotoUploadError(error);
    }
  }

  async upload(uploadUrl: string, localUri: string): Promise<void> {
    // A presigned URL expects the raw file bytes at an arbitrary (non-API) host, so this
    // bypasses `httpClient` entirely — that wrapper always prefixes API_BASE_URL and always
    // sends JSON, neither of which applies to an S3-style PUT.
    let blob: Blob;
    try {
      blob = await (await fetch(localUri)).blob();
    } catch (cause) {
      throw new PhotoUploadError('network_error', cause instanceof Error ? cause.message : undefined);
    }

    let response: Response;
    try {
      response = await fetch(uploadUrl, { method: 'PUT', body: blob });
    } catch (cause) {
      throw new PhotoUploadError('network_error', cause instanceof Error ? cause.message : undefined);
    }

    if (!response.ok) {
      throw new PhotoUploadError('unexpected_error', `Upload responded with ${response.status}`);
    }
  }
}

function toPhotoUploadError(error: unknown): PhotoUploadError {
  if (error instanceof ApiError) {
    if (error.status === 404) return new PhotoUploadError('not_available', error.message);
    if (error.status === 403) return new PhotoUploadError('forbidden', error.message);
    return new PhotoUploadError('unexpected_error', error.message);
  }
  if (error instanceof NetworkError) return new PhotoUploadError('network_error', error.message);
  return new PhotoUploadError('unexpected_error', error instanceof Error ? error.message : undefined);
}
