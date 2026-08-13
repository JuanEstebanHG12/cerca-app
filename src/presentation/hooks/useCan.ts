import React from 'react';
import { Permission, Capacity } from '../../domain/actor';
import { useAuth } from '../context/AuthContext';

export function useCan(permission?: Permission, capacity?: Capacity) {
  const { canDo, hasCapacity } = useAuth();

  const permissionOk = permission ? canDo(permission) : true;
  const capacityOk = capacity ? hasCapacity(capacity) : true;

  return permissionOk && capacityOk;
}

export interface CanProps {
  permission?: Permission;
  capacity?: Capacity;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ permission, capacity, children, fallback = null }) => {
  const allowed = useCan(permission, capacity);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
};
