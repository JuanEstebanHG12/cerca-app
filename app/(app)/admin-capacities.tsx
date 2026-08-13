import React from 'react';
import { View, Text, ScrollView, Switch, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../src/presentation/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { AdminUserCapacityCard } from '../../src/presentation/components/AdminUserCapacityCard';
import { Capacity } from '../../src/domain/actor';
import {
  useAdminSettingsQuery,
  useUpdateCapacitySettingsMutation,
} from '../../src/presentation/hooks/useAdminQueries';

export default function AdminCapacitiesScreen() {
  const { t } = useTranslation();
  const { actor, allUsers, updateUserCapacities } = useAuth();

  const settingsQuery = useAdminSettingsQuery(actor?.platformRole === 'admin');
  const updateSettingsMutation = useUpdateCapacitySettingsMutation();

  const settings = settingsQuery.data || {
    allowCustomerToProviderSelfService: true,
    allowProviderToCustomerSelfService: true,
  };

  const handleToggleGlobalPolicy = (key: 'allowCustomerToProviderSelfService' | 'allowProviderToCustomerSelfService', value: boolean) => {
    const next = { ...settings, [key]: value };
    updateSettingsMutation.mutate(next);
  };

  const handleToggleUserCapacity = async (userId: string, targetCapacity: Capacity, enabled: boolean) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    if (!targetUser) return;

    let updatedCapacities: Capacity[];
    if (enabled) {
      updatedCapacities = Array.from(new Set([...targetUser.capacities, targetCapacity]));
    } else {
      updatedCapacities = targetUser.capacities.filter((c) => c !== targetCapacity);
      if (updatedCapacities.length === 0) {
        Alert.alert('Atención', 'El usuario debe conservar al menos una capacidad.');
        return;
      }
    }

    await updateUserCapacities(userId, updatedCapacities);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>🛡️ {t('admin.title')}</Text>
        <Text style={styles.bannerDesc}>{t('admin.adminVisualsNotice')}</Text>
      </View>

      {/* Global Conversion Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{t('admin.globalSettings')}</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>{t('admin.allowCustomerToProvider')}</Text>
              <Text style={styles.settingSub}>Habilita la acción POST /me/capacities/provider para clientes</Text>
            </View>
            <Switch
              value={settings.allowCustomerToProviderSelfService}
              onValueChange={(val) => handleToggleGlobalPolicy('allowCustomerToProviderSelfService', val)}
              trackColor={{ false: '#d1d5db', true: '#818cf8' }}
              thumbColor={settings.allowCustomerToProviderSelfService ? '#4f46e5' : '#f3f4f6'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>{t('admin.allowProviderToCustomer')}</Text>
              <Text style={styles.settingSub}>Habilita la asignación autónoma de reservas a proveedores</Text>
            </View>
            <Switch
              value={settings.allowProviderToCustomerSelfService}
              onValueChange={(val) => handleToggleGlobalPolicy('allowProviderToCustomerSelfService', val)}
              trackColor={{ false: '#d1d5db', true: '#818cf8' }}
              thumbColor={settings.allowProviderToCustomerSelfService ? '#4f46e5' : '#f3f4f6'}
            />
          </View>
        </View>
      </View>

      {/* Users Capacity Management */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{t('admin.userManagement')}</Text>
        {allUsers.map((userItem) => (
          <AdminUserCapacityCard
            key={userItem.id}
            user={userItem}
            onToggleCapacity={handleToggleUserCapacity}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  banner: {
    backgroundColor: '#4338ca',
    padding: 20,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  bannerDesc: {
    fontSize: 14,
    color: '#e0e7ff',
    lineHeight: 20,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  settingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  settingSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 12,
  },
});
