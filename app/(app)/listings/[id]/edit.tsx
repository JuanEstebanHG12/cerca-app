import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../../src/presentation/auth/auth-context';
import { EditListingForm } from '../../../../src/presentation/listings/edit-listing-form';
import { EmptyState } from '../../../../src/presentation/listings/empty-state';
import { useListing } from '../../../../src/presentation/listings/use-listing';
import { colors } from '../../../../src/presentation/theme/colors';

// This route only ever gets linked to from the detail screen's "Editar" button, which already
// hides itself for a listing that isn't the viewer's own (app/(app)/listings/[id].tsx). The
// `isOwner` check below is not that gate a second time — it's what happens if someone lands
// here anyway (a stale deep link, a listing that changed hands): explain and back out, the same
// "bloqueado por política → explica" Cerca.md describes, never a silent redirect.
export default function EditListing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { actor } = useAuth();
  const listing = useListing(id);

  if (listing.status === 'pending') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (listing.status === 'error') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState
          title="No pudimos cargar el anuncio"
          message="Revisa tu conexión e inténtalo de nuevo."
          primaryAction={{ label: 'Reintentar', onPress: () => listing.refetch() }}
        />
      </SafeAreaView>
    );
  }

  if (actor?.id !== listing.data.ownerId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState
          title="No puedes editar este anuncio"
          message="Solo quien lo publicó puede editarlo."
          primaryAction={{ label: 'Volver', onPress: () => router.back() }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <EditListingForm listing={listing.data} onSaved={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
