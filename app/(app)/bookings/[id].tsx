import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/presentation/auth/auth-context';
import { Button } from '../../../src/presentation/components/button';
import { bookingStatusLabel, formatBookingDate } from '../../../src/presentation/bookings/format-booking';
import { ProviderBookingActions } from '../../../src/presentation/bookings/provider-booking-actions';
import { ReviewSection } from '../../../src/presentation/bookings/review-section';
import { useBooking } from '../../../src/presentation/bookings/use-booking';
import { EmptyState } from '../../../src/presentation/listings/empty-state';
import { useListing } from '../../../src/presentation/listings/use-listing';
import { colors } from '../../../src/presentation/theme/colors';

// This screen is what makes "el estado se refleja al volver atrás" (Cerca.md, US-05) checkable
// at all: it always fetches fresh (see use-booking.ts) instead of trusting whatever the request
// screen last knew, so reopening it — after backgrounding the app, or coming back later — shows
// the booking's real current status, not a stale "Solicitada" that never updates.
export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { actor } = useAuth();
  const booking = useBooking(id);
  // Called unconditionally, before the loading/error returns below — every hook in a component
  // has to run on every render, in the same order (React's rules of hooks). `useListing('')`
  // while the booking itself is still loading is safe: `enabled: id !== ''` (use-listing.ts)
  // means it just sits idle instead of firing a request with a blank id.
  const listing = useListing(booking.data?.listingId ?? '');

  if (booking.status === 'pending') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (booking.status === 'error') {
    const notFound = booking.error.message === 'not_found';
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState
          title={notFound ? 'No encontramos esta reserva' : 'No pudimos cargar la reserva'}
          message={notFound ? 'Puede que ya no exista o no te pertenezca.' : 'Revisa tu conexión e inténtalo de nuevo.'}
          primaryAction={notFound ? { label: 'Volver', onPress: () => router.back() } : { label: 'Reintentar', onPress: () => booking.refetch() }}
        />
      </SafeAreaView>
    );
  }

  const data = booking.data;

  // Only the customer who made the booking ever sees the review section — a provider looking at
  // their own completed booking has nothing to review. review-section.tsx double-checks this
  // itself (canReviewBooking's 'not_your_booking' case), this is just the reason it's never
  // even mounted for a provider in the first place.
  const canShowReview = data.status === 'completed' && actor?.id === data.customerId;
  // The server only ever lets the customer or the listing owner load this booking at all (see
  // use-booking.ts) — so if we're not the customer, we must be the owner. That's the whole
  // check; no separate "am I a provider" lookup needed.
  const isProvider = actor !== null && actor?.id !== data.customerId;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow} maxFontSizeMultiplier={1.6}>
          Reserva
        </Text>
        <Text style={styles.title} maxFontSizeMultiplier={1.6}>
          {listing.data?.title ?? '…'}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText} maxFontSizeMultiplier={1.6}>
            {bookingStatusLabel(data.status)}
          </Text>
        </View>
        <Text style={styles.meta} maxFontSizeMultiplier={1.8}>
          Solicitada el {formatBookingDate(data.requestedAt)}
        </Text>
        {data.status === 'accepted' && data.scheduledFor ? (
          <Text style={styles.meta} maxFontSizeMultiplier={1.8}>
            Programada para el {formatBookingDate(data.scheduledFor)}
          </Text>
        ) : null}

        {isProvider ? <ProviderBookingActions booking={data} /> : null}
        {canShowReview ? <ReviewSection booking={data} customerId={data.customerId} /> : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Volver" variant="secondary" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: 20, gap: 12 },
  eyebrow: { fontSize: 13, fontWeight: '600', color: colors.inkMuted },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.warning,
  },
  badgeText: { fontSize: 13, fontWeight: '700', color: colors.warningInk },
  meta: { fontSize: 15, color: colors.inkMuted },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.surfaceBorder },
});
