import { StyleSheet, Text, View } from 'react-native';
import { ManageBookingFailureReason } from '../../domain/errors/booking-errors';
import { Booking } from '../../domain/models/booking';
import { DECLINE_REASON_OPTIONS, DeclineReason } from '../../domain/models/manage-booking';
import { Button } from '../components/button';
import { Chip } from '../components/chip';
import { colors } from '../theme/colors';
import { useAcceptBooking } from './use-accept-booking';
import { useCompleteBooking } from './use-complete-booking';
import { useDeclineBooking } from './use-decline-booking';

const DECLINE_REASON_LABELS: Record<DeclineReason, string> = {
  unavailable: 'No tengo disponibilidad',
  not_a_fit: 'No es lo que piden',
  other: 'Otro motivo',
};

const MANAGE_ERROR_MESSAGES: Record<ManageBookingFailureReason, string> = {
  not_owner: 'No eres el dueño de este anuncio.',
  invalid_state: 'Esta reserva ya cambió de estado — recarga la pantalla.',
  not_found: 'No encontramos esta reserva.',
  network_error: 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
  unexpected_error: 'Algo salió mal. Intenta de nuevo en un momento.',
};

// This is NOT part of any numbered historia (US-01..US-10 in Cerca.md never asks for a
// provider-side "manage my bookings" screen) — it exists only because, without it, a booking can
// never reach 'completed' inside the app itself, which means US-06's review flow could never be
// demoed for real. See US-06-REVIEW-BOOKING.md §5.
//
// No date picker for "aceptar": scheduledFor defaults to this time tomorrow. A real product
// would ask the provider to pick a date; that's more than this gap needs to unblock the demo.
function tomorrowIso(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString();
}

interface ProviderBookingActionsProps {
  booking: Booking;
}

export function ProviderBookingActions({ booking }: ProviderBookingActionsProps) {
  const accept = useAcceptBooking(booking.id);
  const decline = useDeclineBooking(booking.id);
  const complete = useCompleteBooking(booking.id);

  if (booking.status === 'requested') {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.6}>
          Esta persona quiere reservar tu servicio
        </Text>
        <Button label="Aceptar" onPress={() => accept.mutate({ scheduledFor: tomorrowIso() })} loading={accept.isPending} />

        <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.6}>
          O rechazar, y decir por qué
        </Text>
        <View style={styles.chipRow}>
          {DECLINE_REASON_OPTIONS.map((reason) => (
            <Chip
              key={reason}
              label={DECLINE_REASON_LABELS[reason]}
              selected={false}
              onPress={() => decline.mutate({ reason })}
            />
          ))}
        </View>

        {errorText(accept.data) || errorText(decline.data)}
      </View>
    );
  }

  if (booking.status === 'accepted') {
    return (
      <View style={styles.section}>
        <Button label="Marcar como completada" onPress={() => complete.mutate()} loading={complete.isPending} />
        {errorText(complete.data)}
      </View>
    );
  }

  return null;
}

function errorText(data: { ok: boolean; reason?: ManageBookingFailureReason } | undefined) {
  if (!data || data.ok || !data.reason) return null;
  return (
    <Text style={styles.error} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.8}>
      {MANAGE_ERROR_MESSAGES[data.reason]}
    </Text>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12, marginTop: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.inkMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  error: { fontSize: 14, color: colors.danger },
});
