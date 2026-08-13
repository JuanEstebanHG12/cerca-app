import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiAdminGateway } from '../../infrastructure/api/ApiAdminGateway';
import { UserId, Capacity } from '../../domain/actor';
import { CapacitySettings } from '../../domain/capacityPolicy';

const adminGateway = new ApiAdminGateway();

export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  settings: () => [...adminKeys.all, 'settings'] as const,
};

export function useAdminUsersQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: () => adminGateway.getUsers(),
    enabled,
  });
}

export function useAdminSettingsQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: adminKeys.settings(),
    queryFn: () => adminGateway.getCapacitySettings(),
    enabled,
  });
}

export function useUpdateUserCapacitiesMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, capacities }: { userId: UserId; capacities: Capacity[] }) =>
      adminGateway.updateUserCapacities(userId, capacities),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useUpdateCapacitySettingsMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (settings: CapacitySettings) => adminGateway.updateCapacitySettings(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.settings() });
    },
  });
}
