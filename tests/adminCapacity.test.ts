import { describe, it, expect } from 'vitest';
import {
  canAdminManageCapacities,
  canUserToggleCapacity,
  CapacitySettings,
} from '../src/domain/capacityPolicy';
import { Actor } from '../src/domain/models/actor';

const settingsOpen: CapacitySettings = {
  allowCustomerToProviderSelfService: true,
  allowProviderToCustomerSelfService: true,
};

const settingsClosed: CapacitySettings = {
  allowCustomerToProviderSelfService: false,
  allowProviderToCustomerSelfService: false,
};

const admin: Actor = {
  id: 'admin-1',
  name: 'Admin',
  email: 'admin@cerca.app',
  capacities: ['customer', 'provider'],
  platformRole: 'admin',
};

const customerOnly: Actor = {
  id: 'user-1',
  name: 'Ana',
  email: 'ana@cerca.app',
  capacities: ['customer'],
  platformRole: 'user',
};

const providerOnly: Actor = {
  id: 'user-2',
  name: 'Carlos',
  email: 'carlos@cerca.app',
  capacities: ['provider'],
  platformRole: 'user',
};

describe('canAdminManageCapacities', () => {
  it('admin puede gestionar capacidades', () => {
    expect(canAdminManageCapacities(admin)).toBe(true);
  });

  it('usuario regular NO puede gestionar capacidades', () => {
    expect(canAdminManageCapacities(customerOnly)).toBe(false);
  });
});

describe('canUserToggleCapacity', () => {
  it('cliente puede convertirse en proveedor si la política lo permite', () => {
    const result = canUserToggleCapacity(customerOnly, 'provider', settingsOpen);
    expect(result.ok).toBe(true);
  });

  it('cliente NO puede convertirse en proveedor si la política está deshabilitada', () => {
    const result = canUserToggleCapacity(customerOnly, 'provider', settingsClosed);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('self_service_disabled');
  });

  it('proveedor puede adquirir capacidad cliente si la política lo permite', () => {
    const result = canUserToggleCapacity(providerOnly, 'customer', settingsOpen);
    expect(result.ok).toBe(true);
  });

  it('proveedor NO puede adquirir capacidad cliente si política deshabilitada', () => {
    const result = canUserToggleCapacity(providerOnly, 'customer', settingsClosed);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('self_service_disabled');
  });

  it('ya tiene la capacidad: devuelve capacity_already_granted', () => {
    const result = canUserToggleCapacity(customerOnly, 'customer', settingsOpen);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('capacity_already_granted');
  });

  it('admin SIEMPRE puede asignar capacidades independientemente de la política', () => {
    const result = canUserToggleCapacity(admin, 'provider', settingsClosed);
    // admin ya tiene provider, así que retorna capacity_already_granted
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('capacity_already_granted');
  });
});
