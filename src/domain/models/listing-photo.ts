import { z } from 'zod';

// A photo the user picked on-device, before (or instead of) it ever reaches the server. `uri`
// is a local file:// URI from expo-image-picker — never confused with the `key` a presigned
// upload returns, which is what the backend would actually store on `ListingPhoto`.
export const localPhotoSchema = z.object({
  id: z.string(),
  uri: z.string(),
});
export type LocalPhoto = z.infer<typeof localPhotoSchema>;

// What POST /listings/{id}/photos:presign is documented to return (Cerca.md's API table):
// an S3-style direct-upload URL and the object key the backend will look up afterwards.
export const photoUploadTargetSchema = z.object({
  uploadUrl: z.string(),
  key: z.string(),
});
export type PhotoUploadTarget = z.infer<typeof photoUploadTargetSchema>;
