import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hasCapacity } from '../../../src/domain/models/actor';
import { Booking } from '../../../src/domain/models/booking';
import { useAuth } from '../../../src/presentation/auth/auth-context';
import { bookingStatusLabel, formatBookingDate } from '../../../src/presentation/bookings/format-booking';
import { useMyBookings } from '../../../src/presentation/bookings/use-my-bookings';
import { Chip } from '../../../src/presentation/components/chip';
import { EmptyState } from '../../../src/presentation/listings/empty-state';
import { useListing } from '../../../src/presentation/listings/use-listing';
import { colors } from '../../../src/presentation/theme/colors';

// Not part of any numbered historia — same reason as provider-booking-actions.tsx: without this
// screen there's no way to navigate back to a specific booking to see whether its status (or
// the review form) updated. Every signed-in user is at least a customer, so "Mis reservas"
// always shows; "Solicitudes recibidas" (the provider side, built first — see US-06's doc §
// adenda) only shows for accounts that also have the 'provider' capacity, same account can be
// both at once (Cerca.md's whole point about capacities, not roles).
export default function MyBookings() {
  const { actor } = useAuth();
  const isProvider = actor !== null && hasCapacity(actor, 'provider');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const bookings = useMyBookings(role);

  function renderBody() {
    if (bookings.status === 'pending') {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      );
    }
    if (bookings.status === 'error') {
      return (
        <EmptyState
          title="No pudimos cargar tus reservas"
          message="Revisa tu conexión e inténtalo de nuevo."
          primaryAction={{ label: 'Reintentar', onPress: () => bookings.refetch() }}
        />
      );
    }
    if (bookings.data.items.length === 0) {
      return (
        <EmptyState
          title={role === 'customer' ? 'Todavía no has reservado nada' : 'Todavía no tienes solicitudes'}
          message={
            role === 'customer'
              ? 'Cuando pidas una reserva, va a aparecer aquí.'
              : 'Cuando alguien pida reservar uno de tus anuncios, aparecerá aquí.'
          }
        />
      );
    }
    return (
      <FlatList
        data={bookings.data.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <BookingRow booking={item} />}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title} maxFontSizeMultiplier={1.6}>
        Mis reservas
      </Text>
      {isProvider ? (
        <View style={styles.chipRow}>
          <Chip label="Como cliente" selected={role === 'customer'} onPress={() => setRole('customer')} />
          <Chip label="Solicitudes recibidas" selected={role === 'provider'} onPress={() => setRole('provider')} />
        </View>
      ) : null}
      {renderBody()}
    </SafeAreaView>
  );
}

// Each row fetches its own listing by id — React Query caches by listing id (listingKeys.detail),
// so two rows for the same service only hit the network once, and it's already the same public
// GET the listing detail screen uses.
function BookingRow({ booking }: { booking: Booking }) {
  const listing = useListing(booking.listingId);

  return (
    <Pressable onPress={() => router.push(`/bookings/${booking.id}`)} style={styles.row}>
      <Text style={styles.rowTitle} numberOfLines={1} maxFontSizeMultiplier={1.6}>
        {listing.data?.title ?? '…'}
      </Text>
      <Text style={styles.rowStatus} maxFontSizeMultiplier={1.6}>
        {bookingStatusLabel(booking.status)}
      </Text>
      <Text style={styles.rowDate} maxFontSizeMultiplier={1.8}>
        Solicitada el {formatBookingDate(booking.requestedAt)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink, padding: 20, paddingBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 20 },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder, gap: 4 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  rowStatus: { fontSize: 14, fontWeight: '600', color: colors.accent },
  rowDate: { fontSize: 14, color: colors.inkMuted },
});
