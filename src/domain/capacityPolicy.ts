import { Actor, Capacity, can } from './actor';

export interface CapacitySettings {
  allowCustomerToProviderSelfService: boolean;
  allowProviderToCustomerSelfService: boolean;
}

export type CapacityChangeReason =
  | 'ok'
  | 'unauthorized'
  | 'self_service_disabled'
  | 'capacity_already_granted';

export type CapacityEligibility =
  | { ok: true }
  | { ok: false; reason: CapacityChangeReason };

export function canAdminManageCapacities(actor: Actor): boolean {
  return can(actor, 'user:manage_capacities');
}

export function canUserToggleCapacity(
  actor: Actor,
  targetCapacity: Capacity,
  settings: CapacitySettings
): CapacityEligibility {
  const alreadyHas = actor.capacities.includes(targetCapacity);
  if (alreadyHas) {
    return { ok: false, reason: 'capacity_already_granted' };
  }

  if (targetCapacity === 'provider') {
    if (!settings.allowCustomerToProviderSelfService && actor.platformRole !== 'admin') {
      return { ok: false, reason: 'self_service_disabled' };
    }
  }

  if (targetCapacity === 'customer') {
    if (!settings.allowProviderToCustomerSelfService && actor.platformRole !== 'admin') {
      return { ok: false, reason: 'self_service_disabled' };
    }
  }

  return { ok: true };
}
