import { Actor, Capacity, UserId } from '../../domain/actor';
import { CapacitySettings } from '../../domain/capacityPolicy';

export interface AdminGateway {
  getUsers(): Promise<Actor[]>;
  updateUserCapacities(userId: UserId, capacities: Capacity[]): Promise<Actor>;
  getCapacitySettings(): Promise<CapacitySettings>;
  updateCapacitySettings(settings: CapacitySettings): Promise<CapacitySettings>;
}
