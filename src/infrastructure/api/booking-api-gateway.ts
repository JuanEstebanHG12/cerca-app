import { BookingGateway } from '../../application/ports/booking-gateway';
import { GetBookingError, ManageBookingError, RequestBookingError } from '../../domain/errors/booking-errors';
import { Booking, bookingPageSchema, bookingSchema, BookingPage } from '../../domain/models/booking';
import { CreateBookingInput } from '../../domain/models/create-booking';
import { AcceptBookingInput, DeclineBookingInput } from '../../domain/models/manage-booking';
import { ApiError, NetworkError } from './api-errors';
import { httpClient } from './http-client';

const REQUEST_FORBIDDEN_REASONS = ['own_listing', 'not_bookable', 'no_capacity'] as const;

export class BookingApiGateway implements BookingGateway {
  async request(input: CreateBookingInput, idempotencyKey: string, accessToken: string): Promise<Booking> {
    try {
      const raw = await httpClient.post<unknown>('/bookings', input, accessToken, { 'Idempotency-Key': idempotencyKey });
      return bookingSchema.parse(raw);
    } catch (error) {
      throw toRequestBookingError(error);
    }
  }

  async getById(id: string, accessToken: string): Promise<Booking> {
    try {
      const raw = await httpClient.get<unknown>(`/bookings/${id}`, accessToken);
      return bookingSchema.parse(raw);
    } catch (error) {
      throw toGetBookingError(error);
    }
  }

  async listMine(role: 'customer' | 'provider', accessToken: string): Promise<BookingPage> {
    try {
      const raw = await httpClient.get<unknown>(`/bookings?role=${role}`, accessToken);
      return bookingPageSchema.parse(raw);
    } catch (error) {
      throw toGetBookingError(error);
    }
  }

  async accept(id: string, input: AcceptBookingInput, accessToken: string): Promise<Booking> {
    try {
      const raw = await httpClient.post<unknown>(`/bookings/${id}/accept`, input, accessToken);
      return bookingSchema.parse(raw);
    } catch (error) {
      throw toManageBookingError(error);
    }
  }

  async decline(id: string, input: DeclineBookingInput, accessToken: string): Promise<Booking> {
    try {
      const raw = await httpClient.post<unknown>(`/bookings/${id}/decline`, input, accessToken);
      return bookingSchema.parse(raw);
    } catch (error) {
      throw toManageBookingError(error);
    }
  }

  async complete(id: string, accessToken: string): Promise<Booking> {
    try {
      const raw = await httpClient.post<unknown>(`/bookings/${id}/complete`, undefined, accessToken);
      return bookingSchema.parse(raw);
    } catch (error) {
      throw toManageBookingError(error);
    }
  }
}

function toRequestBookingError(error: unknown): RequestBookingError {
  if (error instanceof ApiError) {
    if (__DEV__ && (error.status === 400 || error.status === 422)) {
      console.warn('[request-booking] server rejected the payload:', error.message);
    }
    // The idempotency interceptor's own errors (cerca-api's IdempotencyInterceptor) don't set
    // `reason` — they're identified by `code`, not by a policy reason, because they're an HTTP
    // concern (the same key reused, or a concurrent duplicate), not a business rule.
    if (error.code === 'IDEMPOTENCY_IN_PROGRESS') return new RequestBookingError('in_progress', error.message);
    if (error.status === 403 && isRequestForbiddenReason(error.reason)) {
      return new RequestBookingError(error.reason, error.message);
    }
    if (error.status === 403) return new RequestBookingError('unexpected_error', error.message);
    if (error.status === 404) return new RequestBookingError('not_found', error.message);
    if (error.status === 422 || error.status === 400) return new RequestBookingError('validation_error', error.message);
    return new RequestBookingError('unexpected_error', error.message);
  }
  if (error instanceof NetworkError) return new RequestBookingError('network_error', error.message);
  return new RequestBookingError('unexpected_error', error instanceof Error ? error.message : undefined);
}

function isRequestForbiddenReason(
  reason: string | undefined,
): reason is (typeof REQUEST_FORBIDDEN_REASONS)[number] {
  return reason !== undefined && (REQUEST_FORBIDDEN_REASONS as readonly string[]).includes(reason);
}

function toGetBookingError(error: unknown): GetBookingError {
  if (error instanceof ApiError) {
    if (error.status === 404) return new GetBookingError('not_found', error.message);
    return new GetBookingError('unexpected_error', error.message);
  }
  if (error instanceof NetworkError) return new GetBookingError('network_error', error.message);
  return new GetBookingError('unexpected_error', error instanceof Error ? error.message : undefined);
}

// accept/decline/complete all fail the same two ways (cerca-api's loadOwnedListing + each
// use-case's own status.kind check): 403 {reason:'not_owner'} if you don't own the listing, or
// 409 {code:'INVALID_BOOKING_STATE'} (no `reason` field — it's not a policy, just a state check)
// if the booking isn't in the right status for this action.
function toManageBookingError(error: unknown): ManageBookingError {
  if (error instanceof ApiError) {
    if (error.status === 403 && error.reason === 'not_owner') return new ManageBookingError('not_owner', error.message);
    if (error.code === 'INVALID_BOOKING_STATE') return new ManageBookingError('invalid_state', error.message);
    if (error.status === 404) return new ManageBookingError('not_found', error.message);
    return new ManageBookingError('unexpected_error', error.message);
  }
  if (error instanceof NetworkError) return new ManageBookingError('network_error', error.message);
  return new ManageBookingError('unexpected_error', error instanceof Error ? error.message : undefined);
}
