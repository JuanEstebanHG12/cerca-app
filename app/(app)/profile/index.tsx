import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useAuth } from '../../../src/presentation/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Actor, Capacity } from '../../../src/domain/actor';
import { useMutation } from '@tanstack/react-query';

export default function ProfileScreen() {
  const { actor, allUsers, signOut, switchActor, toggleMyCapacity } = useAuth();
  const { t, i18n } = useTranslation();

  const isAdmin = actor?.platformRole === 'admin';
  const isModerator = actor?.platformRole === 'moderator';

  const handleSignOut = async () => {
    Alert.alert('Cerrar Sesión', '¿Seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: signOut },
    ]);
  };

  const handleToggleLanguage = () => {
    const next = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(next);
  };

  const renderCapacityBadge = (capacity: Capacity) => {
    const active = actor?.capacities.includes(capacity);
    return (
      <View style={[styles.capBadge, active ? styles.capBadgeActive : styles.capBadgeInactive]}>
        <Text style={[styles.capBadgeText, active && styles.capBadgeTextActive]}>
          {capacity === 'customer' ? '🛒 Cliente' : '🛠️ Proveedor'}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Current User Info */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{actor?.name?.[0] || '?'}</Text>
        </View>
        <Text style={styles.name}>{actor?.name}</Text>
        <Text style={styles.email}>{actor?.email}</Text>

        <View style={styles.badgesRow}>
          {renderCapacityBadge('customer')}
          {renderCapacityBadge('provider')}
        </View>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {actor?.platformRole === 'admin'
              ? '🛡️ Administrador'
              : actor?.platformRole === 'moderator'
              ? '⚖️ Moderador'
              : '👤 Usuario'}
          </Text>
        </View>
      </View>

      {/* Self-service capacity toggle (for regular users) */}
      {!isAdmin && !isModerator && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Capacidades</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchTitle}>Soy Proveedor</Text>
                <Text style={styles.switchSub}>Permite publicar servicios en la plataforma</Text>
              </View>
              <Switch
                value={actor?.capacities.includes('provider') ?? false}
                onValueChange={() => toggleMyCapacity('provider')}
                trackColor={{ false: '#d1d5db', true: '#34d399' }}
                thumbColor={actor?.capacities.includes('provider') ? '#059669' : '#f3f4f6'}
              />
            </View>
            <View style={[styles.switchRow, { marginTop: 12 }]}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchTitle}>Soy Cliente</Text>
                <Text style={styles.switchSub}>Permite solicitar y reservar servicios</Text>
              </View>
              <Switch
                value={actor?.capacities.includes('customer') ?? false}
                onValueChange={() => toggleMyCapacity('customer')}
                trackColor={{ false: '#d1d5db', true: '#818cf8' }}
                thumbColor={actor?.capacities.includes('customer') ? '#4f46e5' : '#f3f4f6'}
              />
            </View>
          </View>
        </View>
      )}

      {/* Identity Simulator — visible only for admin */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 {t('profile.identitySimulator')}</Text>
          <Text style={styles.sectionDesc}>{t('profile.switchIdentityDesc')}</Text>

          {allUsers.map((user: Actor) => {
            const isActive = user.id === actor?.id;
            return (
              <TouchableOpacity
                key={user.id}
                style={[styles.userRow, isActive && styles.userRowActive]}
                onPress={() => switchActor(user.id)}
                accessibilityRole="button"
                accessibilityLabel={`Cambiar a ${user.name}`}
              >
                <View style={[styles.userAvatar, isActive && styles.userAvatarActive]}>
                  <Text style={styles.userAvatarText}>{user.name?.[0] || '?'}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, isActive && styles.userNameActive]}>
                    {user.name}
                  </Text>
                  <Text style={styles.userCapacities}>
                    {user.capacities.join(' · ')} · {user.platformRole}
                  </Text>
                </View>
                {isActive && <Text style={styles.activeTag}>ACTIVO</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Language Toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.languageRow} onPress={handleToggleLanguage}>
            <Text style={styles.languageLabel}>
              {i18n.language === 'es' ? '🇲🇽 Español' : '🇺🇸 English'}
            </Text>
            <Text style={styles.languageToggle}>Cambiar →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { paddingBottom: 40 },

  profileCard: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    padding: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#ffffff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '800', color: '#111827' },
  email: { fontSize: 14, color: '#6b7280', marginTop: 2, marginBottom: 12 },
  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  capBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  capBadgeActive: { backgroundColor: '#eff6ff', borderColor: '#4f46e5' },
  capBadgeInactive: { backgroundColor: '#f3f4f6', borderColor: '#d1d5db' },
  capBadgeText: { fontSize: 13, color: '#9ca3af', fontWeight: '600' },
  capBadgeTextActive: { color: '#4338ca' },
  roleBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: { fontSize: 13, fontWeight: '700', color: '#92400e' },

  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: '#6b7280', marginBottom: 10 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { flex: 1, marginRight: 12 },
  switchTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  switchSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userRowActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#eff6ff',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarActive: { backgroundColor: '#4f46e5' },
  userAvatarText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  userNameActive: { color: '#3730a3' },
  userCapacities: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  activeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4f46e5',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  languageToggle: { fontSize: 14, color: '#4f46e5', fontWeight: '600' },

  signOutBtn: {
    margin: 24,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: { color: '#dc2626', fontSize: 15, fontWeight: '700' },
});
