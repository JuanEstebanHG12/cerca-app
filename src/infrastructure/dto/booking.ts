export type DeclineReason = 'unavailable' | 'not_a_fit' | 'other';
export type BookingRole = 'customer' | 'provider';

export interface CreateBookingApiRequestDto {
  listingId: string;
  note?: string;
}

export interface AcceptBookingApiRequestDto {
  scheduledFor: string;
}

export interface DeclineBookingApiRequestDto {
  reason: DeclineReason;
}

export interface BookingRoleApiQueryDto {
  role: BookingRole;
  cursor?: string;
  limit?: number;
}
