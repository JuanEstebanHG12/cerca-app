import { AuthGateway, AuthResponse } from '../../application/ports/AuthGateway';
import { Actor, Capacity } from '../../domain/actor';
import { mockDb } from '../mock/mockService';

export class ApiAuthGateway implements AuthGateway {
  async signUp(email: string, name: string): Promise<AuthResponse> {
    const actor: Actor = {
      id: `user-${Date.now()}`,
      email,
      name,
      capacities: ['customer'],
      platformRole: 'user',
    };
    mockDb.updateUserCapacities(actor.id, ['customer']);
    return {
      accessToken: `mock-access-token-${actor.id}`,
      refreshToken: `mock-refresh-token-${actor.id}`,
      actor,
    };
  }

  async signIn(email: string): Promise<AuthResponse> {
    const users = mockDb.getUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || users[0];
    mockDb.setCurrentActor(found.id);
    return {
      accessToken: `mock-access-token-${found.id}`,
      refreshToken: `mock-refresh-token-${found.id}`,
      actor: found,
    };
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    const actor = mockDb.getCurrentActor();
    return {
      accessToken: `mock-access-token-refreshed-${actor.id}`,
      refreshToken: token,
      actor,
    };
  }

  async signOut(): Promise<void> {
    // No-op for mock
  }

  async getMe(): Promise<Actor> {
    return mockDb.getCurrentActor();
  }

  async addProviderCapacity(): Promise<Actor> {
    const current = mockDb.getCurrentActor();
    const updatedCapacities: Capacity[] = Array.from(new Set([...current.capacities, 'provider']));
    return mockDb.updateUserCapacities(current.id, updatedCapacities);
  }

  async toggleCapacity(capacity: Capacity): Promise<Actor> {
    const current = mockDb.getCurrentActor();
    let updated: Capacity[];
    if (current.capacities.includes(capacity)) {
      updated = current.capacities.filter((c) => c !== capacity);
      if (updated.length === 0) {
        updated = [capacity]; // Keep at least one
      }
    } else {
      updated = [...current.capacities, capacity];
    }
    return mockDb.updateUserCapacities(current.id, updated);
  }
}
