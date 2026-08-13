import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '../../src/presentation/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

export default function AppLayout() {
  const { actor, canDo, hasCapacity } = useAuth();
  const { t } = useTranslation();

  const isProvider = hasCapacity('provider') || actor?.platformRole === 'admin';
  const isAdmin = canDo('user:manage_capacities');

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen
        name="search/index"
        options={{
          title: t('nav.search'),
          tabBarLabel: t('nav.search'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🔍</Text>,
        }}
      />
      <Tabs.Screen
        name="bookings/index"
        options={{
          title: t('nav.bookings'),
          tabBarLabel: t('nav.bookings'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="provider-hub"
        options={{
          title: t('nav.providerHub'),
          tabBarLabel: t('nav.providerHub'),
          href: isProvider ? '/(app)/provider-hub' : null,
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🛠️</Text>,
        }}
      />
      <Tabs.Screen
        name="admin-capacities"
        options={{
          title: t('nav.adminPanel'),
          tabBarLabel: t('nav.adminPanel'),
          href: isAdmin ? '/(app)/admin-capacities' : null,
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🛡️</Text>,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: t('nav.profile'),
          tabBarLabel: t('nav.profile'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👤</Text>,
        }}
      />
      <Tabs.Screen
        name="listings/[id]"
        options={{
          href: null, // Hide from tab bar
          title: 'Detalle',
        }}
      />
      <Tabs.Screen
        name="bookings/[id]/index"
        options={{
          href: null,
          title: 'Detalle Reserva',
        }}
      />
      <Tabs.Screen
        name="bookings/[id]/review"
        options={{
          href: null,
          title: 'Reseña',
        }}
      />
    </Tabs>
  );
}
