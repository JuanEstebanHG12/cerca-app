import { LocalPhoto } from '../../domain/models/listing-photo';
import { PhotoGateway } from '../ports/photo-gateway';

export interface UploadListingPhotosResult {
  uploaded: number;
  failed: number;
}

// Best-effort, not all-or-nothing: one photo failing (or, today, every photo failing because
// the backend route doesn't exist) shouldn't take down a listing that otherwise created and
// published fine. The caller decides what to do with `failed > 0` — this use case just reports
// the outcome honestly instead of swallowing it.
export class UploadListingPhotosUseCase {
  constructor(private readonly photoGateway: PhotoGateway) {}

  async execute(listingId: string, photos: readonly LocalPhoto[], accessToken: string): Promise<UploadListingPhotosResult> {
    let uploaded = 0;
    let failed = 0;

    // Sequential on purpose: a handful of photos, on a mobile uplink, is not where parallel
    // requests pay off — and it keeps the "how many done so far" story simple if this ever
    // grows a progress indicator.
    for (const photo of photos) {
      try {
        const target = await this.photoGateway.presign(listingId, accessToken);
        await this.photoGateway.upload(target.uploadUrl, photo.uri);
        uploaded += 1;
      } catch {
        // Not rethrown: a PhotoUploadError here (e.g. 'not_available') is expected today, not
        // exceptional — the loop keeps trying the remaining photos rather than aborting on the
        // first failure.
        failed += 1;
      }
    }

    return { uploaded, failed };
  }
}
