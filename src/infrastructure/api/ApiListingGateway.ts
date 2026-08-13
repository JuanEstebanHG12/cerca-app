import {
  ListingGateway,
  SearchListingsParams,
  PaginatedListings,
  CreateListingData,
} from '../../application/ports/ListingGateway';
import {
  Listing,
  ListingDetail,
  ListingId,
  Category,
  listingDetailSchema,
} from '../../domain/listing';
import { mockDb } from '../mock/mockService';

export class ApiListingGateway implements ListingGateway {
  async getCategories(): Promise<Category[]> {
    return mockDb.getCategories();
  }

  async searchListings(params: SearchListingsParams): Promise<PaginatedListings> {
    let items = mockDb.getListings();

    if (params.query) {
      const q = params.query.toLowerCase();
      items = items.filter(
        (l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
      );
    }

    if (params.categoryId) {
      items = items.filter((l) => l.categoryId === params.categoryId);
    }

    const summaryItems: Listing[] = items.map((detail) => ({
      id: detail.id,
      ownerId: detail.ownerId,
      title: detail.title,
      description: detail.description,
      categoryId: detail.categoryId,
      categoryName: detail.categoryName,
      pricing: detail.pricing,
      status: detail.status,
      location: detail.location,
      cityName: detail.cityName,
      distanceKm: detail.distanceKm,
      coverImage: detail.coverImage,
      ratingAverage: detail.ratingAverage,
      ratingCount: detail.ratingCount,
      isFavorite: detail.isFavorite,
    }));

    return {
      items: summaryItems,
      nextCursor: null,
    };
  }

  async getListingDetail(id: ListingId): Promise<ListingDetail> {
    const raw = mockDb.getListingById(id);
    if (!raw) throw new Error(`Listing ${id} not found`);
    return listingDetailSchema.parse(raw);
  }

  async getMyListings(): Promise<Listing[]> {
    const current = mockDb.getCurrentActor();
    const all = mockDb.getListings();
    return all.filter((l) => l.ownerId === current.id);
  }

  async createListing(data: CreateListingData): Promise<ListingDetail> {
    const current = mockDb.getCurrentActor();
    const categories = mockDb.getCategories();
    const cat = categories.find((c) => c.id === data.categoryId) || categories[0];

    const newDetail: ListingDetail = {
      id: `listing-${Date.now()}`,
      ownerId: current.id,
      ownerName: current.name || 'Proveedor',
      title: data.title,
      description: data.description,
      categoryId: cat.id,
      categoryName: cat.name,
      pricing: data.pricing,
      status: { kind: 'published', publishedAt: new Date().toISOString() },
      location: data.location,
      cityName: data.cityName,
      distanceKm: 1.5,
      coverImage: data.photos[0] || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
      photos: data.photos.length > 0 ? data.photos : ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'],
      ratingAverage: 5.0,
      ratingCount: 0,
      serviceRadiusKm: data.serviceRadiusKm,
      createdAt: new Date().toISOString(),
      isFavorite: false,
    };

    const saved = mockDb.createListing(newDetail);
    return listingDetailSchema.parse(saved);
  }

  async updateListing(id: ListingId, data: Partial<CreateListingData>): Promise<ListingDetail> {
    const updated = mockDb.updateListing(id, data as any);
    return listingDetailSchema.parse(updated);
  }

  async publishListing(id: ListingId): Promise<ListingDetail> {
    const updated = mockDb.updateListing(id, {
      status: { kind: 'published', publishedAt: new Date().toISOString() },
    });
    return listingDetailSchema.parse(updated);
  }

  async pauseListing(id: ListingId): Promise<ListingDetail> {
    const updated = mockDb.updateListing(id, {
      status: { kind: 'paused' },
    });
    return listingDetailSchema.parse(updated);
  }

  async uploadPhoto(id: ListingId, uri: string): Promise<{ uploadUrl: string; key: string }> {
    return {
      uploadUrl: uri,
      key: `photo-${Date.now()}.jpg`,
    };
  }

  async toggleFavorite(id: ListingId, isFavorite: boolean): Promise<boolean> {
    return mockDb.toggleFavorite(id, isFavorite);
  }

  async reportListing(id: ListingId, reason: string): Promise<void> {
    mockDb.updateListing(id, {
      status: { kind: 'under_review', reportId: `rep-${Date.now()}` },
    });
  }

  async moderateListing(id: ListingId, action: 'under_review' | 'removed', reason?: string): Promise<void> {
    const current = mockDb.getCurrentActor();
    if (action === 'removed') {
      mockDb.updateListing(id, {
        status: { kind: 'removed', removedBy: current.id, reason: reason || 'Incumplimiento' },
      });
    } else {
      mockDb.updateListing(id, {
        status: { kind: 'under_review', reportId: `rep-${Date.now()}` },
      });
    }
  }
}
