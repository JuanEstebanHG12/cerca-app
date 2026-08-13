import { describe, it, expect } from 'vitest';
import {
  Actor,
  Capacity,
  PlatformRole,
  can,
  has,
  CAPACITY_PERMISSIONS,
  PLATFORM_PERMISSIONS,
} from '../src/domain/actor';

const makeActor = (
  capacities: Capacity[],
  platformRole: PlatformRole
): Actor => ({
  id: 'test-user',
  name: 'Test User',
  email: 'test@cerca.app',
  capacities,
  platformRole,
});

describe('Actor — can()', () => {
  it('admin puede hacer absolutamente todo', () => {
    const admin = makeActor(['customer', 'provider'], 'admin');
    expect(can(admin, 'listing:read')).toBe(true);
    expect(can(admin, 'listing:create')).toBe(true);
    expect(can(admin, 'listing:moderate')).toBe(true);
    expect(can(admin, 'user:suspend')).toBe(true);
    expect(can(admin, 'user:manage_capacities')).toBe(true);
    expect(can(admin, 'review:moderate')).toBe(true);
    expect(can(admin, 'report:resolve')).toBe(true);
  });

  it('cliente puede buscar y reservar pero NO publicar ni moderar', () => {
    const customer = makeActor(['customer'], 'user');
    expect(can(customer, 'listing:read')).toBe(true);
    expect(can(customer, 'booking:request')).toBe(true);
    expect(can(customer, 'review:write')).toBe(true);
    expect(can(customer, 'listing:create')).toBe(false);
    expect(can(customer, 'listing:moderate')).toBe(false);
    expect(can(customer, 'user:manage_capacities')).toBe(false);
  });

  it('proveedor puede publicar y aceptar reservas pero NO moderar', () => {
    const provider = makeActor(['provider'], 'user');
    expect(can(provider, 'listing:create')).toBe(true);
    expect(can(provider, 'listing:update')).toBe(true);
    expect(can(provider, 'booking:accept')).toBe(true);
    expect(can(provider, 'listing:moderate')).toBe(false);
    expect(can(provider, 'user:suspend')).toBe(false);
    expect(can(provider, 'user:manage_capacities')).toBe(false);
  });

  it('Marta (cliente + proveedor) acumula permisos de ambas capacidades', () => {
    const marta = makeActor(['customer', 'provider'], 'user');
    expect(can(marta, 'listing:create')).toBe(true);
    expect(can(marta, 'booking:request')).toBe(true);
    expect(can(marta, 'booking:accept')).toBe(true);
    expect(can(marta, 'review:write')).toBe(true);
    expect(can(marta, 'user:manage_capacities')).toBe(false);
  });

  it('moderador puede leer y moderar pero NO gestionar capacidades', () => {
    const mod = makeActor(['customer'], 'moderator');
    expect(can(mod, 'listing:moderate')).toBe(true);
    expect(can(mod, 'report:resolve')).toBe(true);
    expect(can(mod, 'review:moderate')).toBe(true);
    expect(can(mod, 'user:manage_capacities')).toBe(false);
    expect(can(mod, 'user:suspend')).toBe(false);
  });
});

describe('Actor — has()', () => {
  it('has() devuelve true solo para capacidades presentes', () => {
    const customer = makeActor(['customer'], 'user');
    expect(has(customer, 'customer')).toBe(true);
    expect(has(customer, 'provider')).toBe(false);
  });

  it('has() funciona para capacidades duales', () => {
    const both = makeActor(['customer', 'provider'], 'user');
    expect(has(both, 'customer')).toBe(true);
    expect(has(both, 'provider')).toBe(true);
  });
});
