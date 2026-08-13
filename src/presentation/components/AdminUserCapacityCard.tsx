import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Actor, Capacity } from '../../domain/actor';
import { useTranslation } from 'react-i18next';

export interface AdminUserCapacityCardProps {
  user: Actor;
  onToggleCapacity: (userId: string, targetCapacity: Capacity, enabled: boolean) => void;
}

export const AdminUserCapacityCard: React.FC<AdminUserCapacityCardProps> = ({
  user,
  onToggleCapacity,
}) => {
  const { t } = useTranslation();

  const isCustomer = user.capacities.includes('customer');
  const isProvider = user.capacities.includes('provider');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{user.name || 'Usuario'}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.platformRole.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Permisos de Capacidad</Text>

      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.labelTitle}>Capacidad de Cliente</Text>
          <Text style={styles.labelSub}>Permite buscar y reservar servicios</Text>
        </View>
        <Switch
          value={isCustomer}
          onValueChange={(val) => onToggleCapacity(user.id, 'customer', val)}
          trackColor={{ false: '#d1d5db', true: '#818cf8' }}
          thumbColor={isCustomer ? '#4f46e5' : '#f3f4f6'}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.labelTitle}>Capacidad de Proveedor</Text>
          <Text style={styles.labelSub}>Permite publicar y ofrecer servicios</Text>
        </View>
        <Switch
          value={isProvider}
          onValueChange={(val) => onToggleCapacity(user.id, 'provider', val)}
          trackColor={{ false: '#d1d5db', true: '#34d399' }}
          thumbColor={isProvider ? '#059669' : '#f3f4f6'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  email: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  labelContainer: {
    flex: 1,
    marginRight: 12,
  },
  labelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  labelSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
});
