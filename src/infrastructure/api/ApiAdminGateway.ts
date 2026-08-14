import { AdminGateway } from '../../application/ports/AdminGateway';
import { Actor, Capacity, UserId, can } from '../../domain/actor';
import { CapacitySettings } from '../../domain/capacityPolicy';
import { mockDb } from '../mock/mockService';

export class ApiAdminGateway implements AdminGateway {
  private ensureAdminPermission(): void {
    const current = mockDb.getCurrentActor();
    if (!can(current, 'user:manage_capacities')) {
      throw new Error('Forbidden: Admin capacity management permission required');
    }
  }

  async getUsers(): Promise<Actor[]> {
    this.ensureAdminPermission();
    return mockDb.getUsers();
  }

  async updateUserCapacities(userId: UserId, capacities: Capacity[]): Promise<Actor> {
    this.ensureAdminPermission();
    return mockDb.updateUserCapacities(userId, capacities);
  }

  async getCapacitySettings(): Promise<CapacitySettings> {
    this.ensureAdminPermission();
    return mockDb.getCapacitySettings();
  }

  async updateCapacitySettings(settings: CapacitySettings): Promise<CapacitySettings> {
    this.ensureAdminPermission();
    return mockDb.updateCapacitySettings(settings);
  }
}
