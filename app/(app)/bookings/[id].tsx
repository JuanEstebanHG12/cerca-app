import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../src/presentation/components/button';
import { bookingStatusLabel, formatBookingDate } from '../../../src/presentation/bookings/format-booking';
import { useBooking } from '../../../src/presentation/bookings/use-booking';
import { EmptyState } from '../../../src/presentation/listings/empty-state';
import { colors } from '../../../src/presentation/theme/colors';

// This screen is what makes "el estado se refleja al volver atrás" (Cerca.md, US-05) checkable
// at all: it always fetches fresh (see use-booking.ts) instead of trusting whatever the request
// screen last knew, so reopening it — after backgrounding the app, or coming back later — shows
// the booking's real current status, not a stale "Solicitada" that never updates.
export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const booking = useBooking(id);

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title} maxFontSizeMultiplier={1.6}>
          Reserva
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
      </View>
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
