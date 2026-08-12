import { useEffect } from 'react';
import { Control, FieldErrors, useWatch, UseFormSetValue } from 'react-hook-form';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/button';
import { EmptyState } from '../listings/empty-state';
import { colors } from '../theme/colors';
import { useLocation } from '../location/use-location';
import { PublishFormValues } from './publish-form-schema';

interface PublishStepLocationProps {
  control: Control<PublishFormValues>;
  errors: FieldErrors<PublishFormValues>;
  setValue: UseFormSetValue<PublishFormValues>;
}

// Step 3 of 3: where the service is offered. Reuses the exact same GPS flow Home's search
// already built and tested (permission prompt, denied + retry) instead of a second
// implementation — the only thing new here is that the coordinates land on the form instead
// of a search filter.
export function PublishStepLocation({ control, errors, setValue }: PublishStepLocationProps) {
  const location = useLocation();
  const lat = useWatch({ control, name: 'lat' });
  const lng = useWatch({ control, name: 'lng' });

  // `useLocation()` spreads into a new wrapper object every render, but `coords` itself keeps
  // its identity across renders (it only changes when a new GPS reading actually resolves) —
  // narrowing to it here is what keeps this effect from re-firing (and re-validating the form)
  // on every unrelated re-render of this step.
  const coords = location.status === 'granted' ? location.coords : null;
  useEffect(() => {
    if (coords) {
      setValue('lat', coords.lat, { shouldValidate: true });
      setValue('lng', coords.lng, { shouldValidate: true });
    }
  }, [coords, setValue]);

  return (
    <View style={styles.step}>
      <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.6}>
        Ubicación del servicio
      </Text>

      {location.status === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}

      {location.status === 'denied' ? (
        <EmptyState
          title="No pudimos acceder a tu ubicación"
          message="Necesitamos saber dónde ofreces tu servicio para publicarlo."
          primaryAction={{ label: 'Reintentar', onPress: location.retry }}
        />
      ) : null}

      {lat !== null && lng !== null ? (
        <View style={styles.captured}>
          <Text style={styles.capturedText} maxFontSizeMultiplier={1.8}>
            Ubicación capturada: {lat.toFixed(4)}, {lng.toFixed(4)}
          </Text>
          <Button label="Actualizar ubicación" variant="secondary" onPress={location.retry} />
        </View>
      ) : null}

      {errors.lat ? (
        <Text style={styles.error} maxFontSizeMultiplier={1.8}>
          {errors.lat.message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  step: { gap: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.inkMuted },
  loading: { paddingVertical: 24, alignItems: 'center' },
  captured: { gap: 12 },
  capturedText: { fontSize: 15, color: colors.ink },
  error: { fontSize: 13, color: colors.danger },
});
