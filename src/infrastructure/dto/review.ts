export type ReviewModerationAction = 'remove' | 'keep';

export interface WriteReviewApiRequestDto {
  rating: number;
  body: string;
}

export interface ModerateReviewApiRequestDto {
  action: ReviewModerationAction;
  reason?: string;
}
