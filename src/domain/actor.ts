export type UserId = string;

export type Capacity = 'customer' | 'provider';
export type PlatformRole = 'user' | 'moderator' | 'admin';

export interface Actor {
  readonly id: UserId;
  readonly capacities: readonly Capacity[];
  readonly platformRole: PlatformRole;
  readonly name?: string;
  readonly email?: string;
}

export type Permission =
  | 'listing:read'
  | 'listing:create'
  | 'listing:update'
  | 'listing:moderate'
  | 'booking:request'
  | 'booking:accept'
  | 'review:write'
  | 'review:moderate'
  | 'report:resolve'
  | 'user:suspend'
  | 'user:manage_capacities';

export const CAPACITY_PERMISSIONS: Record<Capacity, readonly Permission[]> = {
  customer: ['listing:read', 'booking:request', 'review:write'],
  provider: [
    'listing:read',
    'listing:create',
    'listing:update',
    'booking:request',
    'booking:accept',
    'review:write',
  ],
};

export const PLATFORM_PERMISSIONS: Record<PlatformRole, readonly Permission[]> = {
  user: [],
  moderator: [
    'listing:read',
    'listing:moderate',
    'booking:request',
    'review:write',
    'review:moderate',
    'report:resolve',
  ],
  admin: [
    'listing:read',
    'listing:create',
    'listing:update',
    'listing:moderate',
    'booking:request',
    'booking:accept',
    'review:write',
    'review:moderate',
    'report:resolve',
    'user:suspend',
    'user:manage_capacities',
  ],
};

export const has = (actor: Actor, capacity: Capacity): boolean =>
  actor.capacities.includes(capacity);

export function can(actor: Actor, permission: Permission): boolean {
  const fromCapacities = actor.capacities.some((c) =>
    CAPACITY_PERMISSIONS[c]?.includes(permission)
  );
  const fromRole = PLATFORM_PERMISSIONS[actor.platformRole]?.includes(permission);
  return Boolean(fromCapacities || fromRole);
}
