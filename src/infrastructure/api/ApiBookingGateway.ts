import {
  BookingGateway,
  CreateBookingData,
  CreateReviewData,
} from '../../application/ports/BookingGateway';
import { Booking, BookingId, ReviewId, bookingSchema } from '../../domain/booking';
import { mockDb } from '../mock/mockService';

export class ApiBookingGateway implements BookingGateway {
  async requestBooking(data: CreateBookingData): Promise<Booking> {
    const current = mockDb.getCurrentActor();
    const listing = mockDb.getListingById(data.listingId);
    if (!listing) throw new Error('Listing not found');

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      listingId: listing.id,
      listingTitle: listing.title,
      listingCoverImage: listing.coverImage,
      customerId: current.id,
      customerName: current.name || 'Cliente',
      providerId: listing.ownerId,
      providerName: listing.ownerName,
      status: { kind: 'requested', requestedAt: new Date().toISOString() },
      scheduledFor: data.scheduledFor,
      notes: data.notes,
      reviewId: null,
      createdAt: new Date().toISOString(),
    };

    const saved = mockDb.addBooking(newBooking);
    return bookingSchema.parse(saved);
  }

  async getBookings(role: 'customer' | 'provider'): Promise<Booking[]> {
    const current = mockDb.getCurrentActor();
    const all = mockDb.getBookings();

    if (role === 'customer') {
      return all.filter((b) => b.customerId === current.id);
    } else {
      return all.filter((b) => b.providerId === current.id);
    }
  }

  async getBookingDetail(id: BookingId): Promise<Booking> {
    const all = mockDb.getBookings();
    const found = all.find((b) => b.id === id);
    if (!found) throw new Error('Booking not found');
    return bookingSchema.parse(found);
  }

  async acceptBooking(id: BookingId, scheduledFor: string): Promise<Booking> {
    const updated = mockDb.updateBookingStatus(id, {
      kind: 'accepted',
      acceptedAt: new Date().toISOString(),
      scheduledFor,
    });
    return bookingSchema.parse(updated);
  }

  async declineBooking(id: BookingId, reason: string): Promise<Booking> {
    const updated = mockDb.updateBookingStatus(id, {
      kind: 'declined',
      reason,
    });
    return bookingSchema.parse(updated);
  }

  async completeBooking(id: BookingId): Promise<Booking> {
    const updated = mockDb.updateBookingStatus(id, {
      kind: 'completed',
      completedAt: new Date().toISOString(),
    });
    return bookingSchema.parse(updated);
  }

  async cancelBooking(id: BookingId): Promise<Booking> {
    const current = mockDb.getCurrentActor();
    const updated = mockDb.updateBookingStatus(id, {
      kind: 'cancelled',
      cancelledBy: current.id,
      at: new Date().toISOString(),
    });
    return bookingSchema.parse(updated);
  }

  async createReview(bookingId: BookingId, data: CreateReviewData): Promise<{ reviewId: ReviewId }> {
    const reviewId = `rev-${Date.now()}`;
    mockDb.attachReviewToBooking(bookingId, reviewId);
    return { reviewId };
  }
}
