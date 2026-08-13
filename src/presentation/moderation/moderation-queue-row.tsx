import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ModerationDecision, ResolveModerationResult } from '../../application/use-cases/resolve-moderation';
import { Report } from '../../domain/models/report';
import { Button } from '../components/button';
import { TextField } from '../components/text-field';
import { statusBadgeLabel } from '../listings/format-listing';
import { useListing } from '../listings/use-listing';
import { colors } from '../theme/colors';
import { formatBookingDate } from '../bookings/format-booking';
import { useResolveModeration } from './use-resolve-moderation';

// Both ModerateListingFailureReason and ResolveReportFailureReason are read through this same
// map — they overlap on every value except 'already_resolved', which only the report side can
// produce. One map instead of two, same "one place, not duplicated" idea as US-06's
// REVIEW_MESSAGES.
const REASON_MESSAGES: Record<string, string> = {
  no_capacity: 'No tienes permiso para moderar.',
  not_found: 'No encontramos este anuncio o este reporte.',
  already_resolved: 'Otra persona ya resolvió este reporte.',
  validation_error: 'Escribe un motivo antes de continuar.',
  network_error: 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
  unexpected_error: 'Algo salió mal. Intenta de nuevo en un momento.',
};

function resultMessage(result: ResolveModerationResult): string | null {
  if (!result.ok) return REASON_MESSAGES[result.reason] ?? REASON_MESSAGES.unexpected_error;
  // Listing changed but the report itself couldn't close (best-effort call failed) — see
  // ResolveModerationUseCase. The listing change is real; this is a caveat, not a failure.
  if (result.reportError) return `Anuncio actualizado, pero no pudimos cerrar el reporte: ${REASON_MESSAGES[result.reportError] ?? ''}`;
  return null;
}

interface ModerationQueueRowProps {
  report: Report;
}

// Each row fetches its own listing by id — same lazy per-row query app/(app)/bookings/index.tsx
// already uses for "Mis reservas", cached by listing id so two reports on the same listing only
// hit the network once.
export function ModerationQueueRow({ report }: ModerationQueueRowProps) {
  const listing = useListing(report.listingId);
  const [note, setNote] = useState('');
  const resolveModeration = useResolveModeration();

  const canActOnListing = note.trim().length > 0;
  const message = resolveModeration.data ? resultMessage(resolveModeration.data) : null;

  function act(decision: ModerationDecision) {
    resolveModeration.mutate(
      { reportId: report.id, listingId: report.listingId, decision, note: note.trim() },
      {
        onSuccess: (result) => {
          if (result.ok && (decision === 'dismiss' || (decision === 'removed' && !result.reportError))) {
            setNote('');
          }
        },
      },
    );
  }

  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.push(`/listings/${report.listingId}`)} style={styles.header}>
        <Text style={styles.listingTitle} numberOfLines={1} maxFontSizeMultiplier={1.6}>
          {listing.data?.title ?? (listing.status === 'error' ? 'Anuncio no disponible' : '…')}
        </Text>
        {listing.data ? (
          <Text style={styles.listingStatus} maxFontSizeMultiplier={1.6}>
            {statusBadgeLabel(listing.data.status) ?? 'Publicado'}
          </Text>
        ) : null}
      </Pressable>

      <Text style={styles.reasonLabel} maxFontSizeMultiplier={1.6}>
        Motivo del reporte
      </Text>
      <Text style={styles.reason} maxFontSizeMultiplier={1.8}>
        {report.reason}
      </Text>
      <Text style={styles.date} maxFontSizeMultiplier={1.8}>
        Denunciado el {formatBookingDate(report.createdAt)}
      </Text>

      <TextField
        label="Nota de moderación"
        hint="obligatoria para retirar o poner en revisión"
        placeholder="Explica la decisión…"
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={2}
        style={styles.multiline}
        maxLength={500}
      />

      <View style={styles.actions}>
        <Button
          label="Retirar"
          variant="secondary"
          onPress={() => act('removed')}
          disabled={!canActOnListing || resolveModeration.isPending}
          loading={resolveModeration.isPending}
          style={styles.actionButton}
        />
        <Button
          label="Poner en revisión"
          variant="secondary"
          onPress={() => act('under_review')}
          disabled={!canActOnListing || resolveModeration.isPending}
          loading={resolveModeration.isPending}
          style={styles.actionButton}
        />
        <Button
          label="Descartar"
          onPress={() => act('dismiss')}
          disabled={resolveModeration.isPending}
          loading={resolveModeration.isPending}
          style={styles.actionButton}
        />
      </View>

      {message ? (
        <Text style={styles.message} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.8}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 44 },
  listingTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.ink },
  listingStatus: { fontSize: 12, fontWeight: '600', color: colors.warning },
  reasonLabel: { fontSize: 12, fontWeight: '600', color: colors.inkMuted },
  reason: { fontSize: 15, color: colors.ink },
  date: { fontSize: 13, color: colors.inkMuted },
  multiline: { minHeight: 60, textAlignVertical: 'top', paddingTop: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  actionButton: { flexGrow: 1, minWidth: 100, paddingHorizontal: 12 },
  message: { fontSize: 14, color: colors.inkMuted },
});
