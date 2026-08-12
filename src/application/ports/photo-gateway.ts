import { PhotoUploadTarget } from '../../domain/models/listing-photo';

// Port: the application knows a listing's photos get uploaded in two steps — ask the server
// for a place to put the file, then put the file there. It has no idea `presign` is a POST that
// 404s today because the backend route doesn't exist yet, or that `upload` is a raw PUT to an
// S3-style URL instead of a JSON call through the API — that lives behind PhotoApiGateway in
// src/infrastructure/api.
export interface PhotoGateway {
  presign(listingId: string, accessToken: string): Promise<PhotoUploadTarget>;
  upload(uploadUrl: string, localUri: string): Promise<void>;
}
