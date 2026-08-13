import { Actor, Capacity, UserId } from '../../domain/actor';
import { Listing, ListingDetail, Category } from '../../domain/listing';
import { Booking } from '../../domain/booking';
import { CapacitySettings } from '../../domain/capacityPolicy';

export const INITIAL_ACTORS: Actor[] = [
  {
    id: 'user-admin-1',
    name: 'Admin Boss (Toda la Plataforma)',
    email: 'admin@cerca.app',
    capacities: ['customer', 'provider'],
    platformRole: 'admin',
  },
  {
    id: 'user-marta-2',
    name: 'Marta (Cliente y Profesora)',
    email: 'marta@cerca.app',
    capacities: ['customer', 'provider'],
    platformRole: 'user',
  },
  {
    id: 'user-carlos-3',
    name: 'Carlos (Fontanero)',
    email: 'carlos@cerca.app',
    capacities: ['provider'],
    platformRole: 'user',
  },
  {
    id: 'user-ana-4',
    name: 'Ana (Cliente)',
    email: 'ana@cerca.app',
    capacities: ['customer'],
    platformRole: 'user',
  },
  {
    id: 'user-mod-5',
    name: 'Inspector Moderador',
    email: 'mod@cerca.app',
    capacities: ['customer'],
    platformRole: 'moderator',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-plumbing', name: 'Fontanería & Gas', icon: 'wrench' },
  { id: 'cat-music', name: 'Clases de Música', icon: 'music' },
  { id: 'cat-pets', name: 'Mascotas & Paseos', icon: 'dog' },
  { id: 'cat-electric', name: 'Electricidad', icon: 'zap' },
  { id: 'cat-cleaning', name: 'Hogar & Limpieza', icon: 'sparkles' },
];

export const INITIAL_LISTINGS: ListingDetail[] = [
  {
    id: 'listing-1',
    ownerId: 'user-carlos-3',
    ownerName: 'Carlos Fontanero',
    title: 'Reparación de Fugas y Fontanería Urgente',
    description: 'Solución profesional a fugas de agua, instalación de fregaderos y mantenimiento de tuberías con garantía de 6 meses.',
    categoryId: 'cat-plumbing',
    categoryName: 'Fontanería & Gas',
    pricing: {
      model: 'hourly',
      hourlyRate: { amountMinor: 45000, currency: 'MXN' },
      minimumHours: 2,
    },
    status: { kind: 'published', publishedAt: '2026-01-10T10:00:00Z' },
    location: { lat: 19.4326, lng: -99.1332 },
    cityName: 'Ciudad de México',
    distanceKm: 1.2,
    coverImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.9,
    ratingCount: 128,
    serviceRadiusKm: 15,
    createdAt: '2026-01-10T10:00:00Z',
    isFavorite: true,
  },
  {
    id: 'listing-2',
    ownerId: 'user-marta-2',
    ownerName: 'Marta Clases',
    title: 'Clases de Guitarra Acústica y Eléctrica',
    description: 'Aprende guitarra desde cero o perfecciona tu técnica con lecciones personalizadas para todas las edades.',
    categoryId: 'cat-music',
    categoryName: 'Clases de Música',
    pricing: {
      model: 'fixed',
      price: { amountMinor: 35000, currency: 'MXN' },
    },
    status: { kind: 'published', publishedAt: '2026-01-15T12:00:00Z' },
    location: { lat: 19.4350, lng: -99.1380 },
    cityName: 'Ciudad de México',
    distanceKm: 2.5,
    coverImage: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 5.0,
    ratingCount: 42,
    serviceRadiusKm: 10,
    createdAt: '2026-01-15T12:00:00Z',
    isFavorite: false,
  },
  {
    id: 'listing-3',
    ownerId: 'user-admin-1',
    ownerName: 'Admin Boss',
    title: 'Consultoría e Instalación Eléctrica Residencial',
    description: 'Diagnóstico de redes eléctricas, tableros de control e iluminación LED inteligente.',
    categoryId: 'cat-electric',
    categoryName: 'Electricidad',
    pricing: {
      model: 'quote',
      startingFrom: { amountMinor: 50000, currency: 'MXN' },
    },
    status: { kind: 'published', publishedAt: '2026-02-01T09:00:00Z' },
    location: { lat: 19.4280, lng: -99.1410 },
    cityName: 'Ciudad de México',
    distanceKm: 3.1,
    coverImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    ],
    ratingAverage: 4.8,
    ratingCount: 19,
    serviceRadiusKm: 20,
    createdAt: '2026-02-01T09:00:00Z',
    isFavorite: false,
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'booking-1',
    listingId: 'listing-1',
    listingTitle: 'Reparación de Fugas y Fontanería Urgente',
    listingCoverImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    customerId: 'user-ana-4',
    customerName: 'Ana Customer',
    providerId: 'user-carlos-3',
    providerName: 'Carlos Fontanero',
    status: { kind: 'completed', completedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    scheduledFor: '2026-08-08T15:00:00Z',
    notes: 'Revisión de fuga bajo lavabo principal',
    reviewId: null,
    createdAt: '2026-08-07T10:00:00Z',
  },
  {
    id: 'booking-2',
    listingId: 'listing-2',
    listingTitle: 'Clases de Guitarra Acústica y Eléctrica',
    listingCoverImage: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
    customerId: 'user-admin-1',
    customerName: 'Admin Boss',
    providerId: 'user-marta-2',
    providerName: 'Marta Clases',
    status: { kind: 'completed', completedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
    scheduledFor: '2026-08-03T16:00:00Z',
    notes: 'Primera clase de iniciación',
    reviewId: 'review-100',
    createdAt: '2026-08-02T12:00:00Z',
  },
];

class MockBackendDatabase {
  private actors: Actor[] = [...INITIAL_ACTORS];
  private listings: ListingDetail[] = [...INITIAL_LISTINGS];
  private bookings: Booking[] = [...INITIAL_BOOKINGS];
  private currentActor: Actor = INITIAL_ACTORS[0]; // Default: Admin Boss
  private capacitySettings: CapacitySettings = {
    allowCustomerToProviderSelfService: true,
    allowProviderToCustomerSelfService: true,
  };

  getCurrentActor(): Actor {
    return this.currentActor;
  }

  setCurrentActor(actorId: UserId): Actor {
    const found = this.actors.find((a) => a.id === actorId);
    if (found) {
      this.currentActor = found;
    }
    return this.currentActor;
  }

  getUsers(): Actor[] {
    return [...this.actors];
  }

  updateUserCapacities(userId: UserId, capacities: Capacity[]): Actor {
    const idx = this.actors.findIndex((a) => a.id === userId);
    if (idx === -1) {
      throw new Error(`User ${userId} not found`);
    }
    const updated: Actor = {
      ...this.actors[idx],
      capacities: [...capacities],
    };
    this.actors[idx] = updated;

    if (this.currentActor.id === userId) {
      this.currentActor = updated;
    }
    return updated;
  }

  getCapacitySettings(): CapacitySettings {
    return { ...this.capacitySettings };
  }

  updateCapacitySettings(settings: CapacitySettings): CapacitySettings {
    this.capacitySettings = { ...settings };
    return this.capacitySettings;
  }

  getCategories(): Category[] {
    return INITIAL_CATEGORIES;
  }

  getListings(): ListingDetail[] {
    return [...this.listings];
  }

  getListingById(id: string): ListingDetail | undefined {
    return this.listings.find((l) => l.id === id);
  }

  createListing(listing: ListingDetail): ListingDetail {
    this.listings.unshift(listing);
    return listing;
  }

  updateListing(id: string, updates: Partial<ListingDetail>): ListingDetail {
    const idx = this.listings.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Listing not found');
    const updated = { ...this.listings[idx], ...updates };
    this.listings[idx] = updated;
    return updated;
  }

  toggleFavorite(id: string, isFav: boolean): boolean {
    const item = this.listings.find((l) => l.id === id);
    if (item) {
      item.isFavorite = isFav;
    }
    return isFav;
  }

  getBookings(): Booking[] {
    return [...this.bookings];
  }

  addBooking(booking: Booking): Booking {
    this.bookings.unshift(booking);
    return booking;
  }

  updateBookingStatus(id: string, status: Booking['status']): Booking {
    const idx = this.bookings.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Booking not found');
    this.bookings[idx] = { ...this.bookings[idx], status };
    return this.bookings[idx];
  }

  attachReviewToBooking(bookingId: string, reviewId: string): void {
    const idx = this.bookings.findIndex((b) => b.id === bookingId);
    if (idx !== -1) {
      this.bookings[idx] = { ...this.bookings[idx], reviewId };
    }
  }
}

export const mockDb = new MockBackendDatabase();
