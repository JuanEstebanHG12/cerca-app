import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CreateReportFailureReason } from '../../domain/errors/report-errors';
import { Button } from '../components/button';
import { TextField } from '../components/text-field';
import { colors } from '../theme/colors';
import { useCreateReport } from './use-create-report';

const CREATE_REPORT_MESSAGES: Record<CreateReportFailureReason, string> = {
  not_found: 'No encontramos este anuncio.',
  validation_error: 'Escribe al menos unas palabras explicando el motivo.',
  network_error: 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
  unexpected_error: 'Algo salió mal. Intenta de nuevo en un momento.',
};

interface ReportListingButtonProps {
  listingId: string;
}

// Only ever rendered for a signed-in non-owner — the listing detail screen decides that, same
// split as "Solicitar reserva". Any signed-in account can report; there's no permission check
// beyond having a session (verified against cerca-api's report-create.controller.ts — no
// @RequirePermission on this route, unlike the moderator-only endpoints in use-resolve-moderation.ts).
export function ReportListingButton({ listingId }: ReportListingButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState('');
  const createReport = useCreateReport(listingId);

  if (createReport.data?.ok) {
    return (
      <Text style={styles.confirmed} maxFontSizeMultiplier={1.8}>
        Gracias, recibimos tu reporte.
      </Text>
    );
  }

  if (!expanded) {
    return (
      <Pressable onPress={() => setExpanded(true)} accessibilityRole="button" style={styles.trigger}>
        <Text style={styles.triggerLabel} maxFontSizeMultiplier={1.6}>
          Denunciar este anuncio
        </Text>
      </Pressable>
    );
  }

  // Mirrors createReportSchema's z.string().min(3).max(500) — same "match the backend's real
  // rule client-side" discipline as minimumHours in US-03 (§1.4, hallazgo 3).
  const canSubmit = reason.trim().length >= 3;

  return (
    <View style={styles.form}>
      <TextField
        label="Motivo del reporte"
        placeholder="¿Qué está mal con este anuncio?"
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={3}
        style={styles.multiline}
        maxLength={500}
      />
      <View style={styles.formActions}>
        <Button
          label="Enviar"
          onPress={() => createReport.mutate({ reason: reason.trim() })}
          loading={createReport.isPending}
          disabled={!canSubmit || createReport.isPending}
          style={styles.formButton}
        />
        <Button label="Cancelar" variant="secondary" onPress={() => setExpanded(false)} style={styles.formButton} />
      </View>
      {createReport.data && !createReport.data.ok ? (
        <Text style={styles.error} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.8}>
          {CREATE_REPORT_MESSAGES[createReport.data.reason]}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: { minHeight: 44, justifyContent: 'center' },
  triggerLabel: { fontSize: 14, fontWeight: '600', color: colors.danger },
  form: { gap: 10 },
  multiline: { minHeight: 70, textAlignVertical: 'top', paddingTop: 12 },
  formActions: { flexDirection: 'row', gap: 8 },
  formButton: { flex: 1 },
  error: { fontSize: 14, color: colors.danger },
  confirmed: { fontSize: 14, color: colors.inkMuted },
});
