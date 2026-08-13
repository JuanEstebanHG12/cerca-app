import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WriteReviewFailureReason } from '../../domain/errors/review-errors';
import { Booking } from '../../domain/models/booking';
import { canReviewBooking } from '../../domain/models/review-eligibility';
import { Button } from '../components/button';
import { Chip } from '../components/chip';
import { TextField } from '../components/text-field';
import { colors } from '../theme/colors';
import { useReviewForBooking } from './use-review-for-booking';
import { useWriteReview } from './use-write-review';

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

// Messages for the two reasons the acceptance criterion names by name (US-05-... no, US-06:
// "reseñar dos veces muestra 'ya reseñaste esta reserva'; fuera de plazo muestra su propio
// mensaje") plus the other two the same policy can produce. One map, used both to explain a
// blocked state *before* the user tries (canReviewBooking, checked with the booking already in
// hand) and to explain a rejection *after* trying (the server re-runs the exact same rule).
const REVIEW_MESSAGES: Record<WriteReviewFailureReason, string> = {
  not_your_booking: 'No puedes reseñar una reserva que no es tuya.',
  not_completed: 'Solo puedes reseñar una reserva completada.',
  already_reviewed: 'Ya reseñaste esta reserva.',
  window_closed: 'Ya pasaron más de 30 días desde que se completó — no puedes reseñarla.',
  validation_error: 'Revisa la reseña e intenta de nuevo.',
  not_found: 'No encontramos esta reserva.',
  network_error: 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
  unexpected_error: 'Algo salió mal. Intenta de nuevo en un momento.',
};

interface ReviewSectionProps {
  booking: Booking;
  customerId: string;
}

// Only ever rendered when the viewer is the booking's customer and the booking is completed —
// the parent screen (bookings/[id].tsx) checks that first. This component only has to decide
// between three things: the form, a blocked explanation, or (if eligible) nothing extra to say.
export function ReviewSection({ booking, customerId }: ReviewSectionProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState('');
  const writeReview = useWriteReview(booking.id);

  // `new Date()` is called once, right here, at render time — not buried inside
  // canReviewBooking. That's the "now is a parameter" idea from Cerca.md in practice.
  const eligibility = canReviewBooking(customerId, booking, new Date());
  // Every hook this component uses has to run on every render, in the same order, whether or
  // not its result ends up used below (React's rules of hooks — a hook behind an `if` and a
  // `return` would run on some renders and not others). So this is called unconditionally here,
  // even though its result is only read in one specific branch further down.
  const oldReview = useReviewForBooking(booking.listingId, booking.id, !eligibility.ok && eligibility.reason === 'already_reviewed');

  // Checked before `eligibility.ok` on purpose. The moment a submit succeeds, the parent
  // screen's cached booking gets a fresh `reviewId` (use-write-review.ts), which flows back down
  // here as a new `booking` prop and flips `eligibility.ok` to false ('already_reviewed') on the
  // very next render — so without this check first, the confirmation below would never be
  // reachable: the blocked-message branch would always win the instant a submit worked.
  if (writeReview.data?.ok) {
    const { review } = writeReview.data;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.6}>
          Tu reseña
        </Text>
        <Text style={styles.confirmedText} maxFontSizeMultiplier={1.8}>
          {'⭐'.repeat(review.rating)} ({review.rating}/5)
        </Text>
        <Text style={styles.confirmedText} maxFontSizeMultiplier={1.8}>
          {review.body}
        </Text>
      </View>
    );
  }

  if (!eligibility.ok) {
    if (eligibility.reason === 'already_reviewed' && oldReview.data) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.6}>
            Tu reseña
          </Text>
          <Text style={styles.confirmedText} maxFontSizeMultiplier={1.8}>
            {'⭐'.repeat(oldReview.data.rating)} ({oldReview.data.rating}/5)
          </Text>
          <Text style={styles.confirmedText} maxFontSizeMultiplier={1.8}>
            {oldReview.data.body}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.section}>
        <Text style={styles.blockedText} maxFontSizeMultiplier={1.8}>
          {REVIEW_MESSAGES[eligibility.reason]}
        </Text>
      </View>
    );
  }

  const canSubmit = rating !== null && body.trim().length > 0;

  function handleSubmit() {
    if (rating === null) return;
    writeReview.mutate({ rating, body: body.trim() });
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.6}>
        Deja tu reseña
      </Text>

      <View style={styles.chipRow}>
        {RATING_OPTIONS.map((value) => (
          <Chip key={value} label={String(value)} selected={rating === value} onPress={() => setRating(value)} />
        ))}
      </View>

      <TextField
        label="Comentario"
        placeholder="¿Cómo te fue con este servicio?"
        value={body}
        onChangeText={setBody}
        multiline
        numberOfLines={4}
        style={styles.multiline}
        maxLength={2000}
      />

      <Button label="Enviar reseña" onPress={handleSubmit} loading={writeReview.isPending} disabled={!canSubmit || writeReview.isPending} />

      {writeReview.data && !writeReview.data.ok ? (
        <Text style={styles.blockedText} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.8}>
          {REVIEW_MESSAGES[writeReview.data.reason]}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12, marginTop: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.inkMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  multiline: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
  blockedText: { fontSize: 14, color: colors.inkMuted },
  confirmedText: { fontSize: 15, color: colors.ink },
});
