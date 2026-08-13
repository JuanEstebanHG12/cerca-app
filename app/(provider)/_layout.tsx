import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/presentation/context/AuthContext';

export default function ProviderLayout() {
  const { actor } = useAuth();

  const hasProviderCapacity =
    actor?.capacities.includes('provider') || actor?.platformRole === 'admin';

  if (!hasProviderCapacity) {
    return <Redirect href="/(app)/search/index" />;
  }

  return <Stack screenOptions={{ headerShown: true }} />;
}
