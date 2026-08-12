import { Control, Controller, FieldErrors, useWatch } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { Chip } from '../components/chip';
import { TextField } from '../components/text-field';
import { colors } from '../theme/colors';
import { CURRENCY_OPTIONS, PRICING_MODEL_OPTIONS, PricingModelOption, PublishFormValues } from './publish-form-schema';

interface PublishStepPricingProps {
  control: Control<PublishFormValues>;
  errors: FieldErrors<PublishFormValues>;
}

const MODEL_LABELS: Record<PricingModelOption, string> = {
  fixed: 'Precio fijo',
  hourly: 'Por hora',
  quote: 'Presupuesto',
};

// Step 2 of 3: `Pricing` drives the form, not the other way around (Cerca.md: "el modelo de
// precio dirige el formulario"). Switching the model swaps which fields render — 'quote' shows
// none at all, matching the acceptance criterion literally ("'presupuesto' no pide precio").
export function PublishStepPricing({ control, errors }: PublishStepPricingProps) {
  const pricingModel = useWatch({ control, name: 'pricingModel' });

  return (
    <View style={styles.step}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.6}>
          Modelo de precio
        </Text>
        <Controller
          control={control}
          name="pricingModel"
          render={({ field: { value, onChange } }) => (
            <View style={styles.chipRow}>
              {PRICING_MODEL_OPTIONS.map((model) => (
                <Chip key={model} label={MODEL_LABELS[model]} selected={value === model} onPress={() => onChange(model)} />
              ))}
            </View>
          )}
        />
      </View>

      {pricingModel === 'quote' ? (
        <Text style={styles.hint} maxFontSizeMultiplier={1.8}>
          Con "presupuesto" no pides un precio fijo — quien reserve acuerda el costo contigo
          directamente.
        </Text>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.6}>
            Moneda
          </Text>
          <Controller
            control={control}
            name="currency"
            render={({ field: { value, onChange } }) => (
              <View style={styles.chipRow}>
                {CURRENCY_OPTIONS.map((currency) => (
                  <Chip key={currency} label={currency} selected={value === currency} onPress={() => onChange(currency)} />
                ))}
              </View>
            )}
          />
        </View>
      )}

      {pricingModel === 'fixed' ? (
        <Controller
          control={control}
          name="fixedAmount"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={styles.field}>
              <TextField
                label="Precio"
                placeholder="450"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="decimal-pad"
              />
              {errors.fixedAmount ? (
                <Text style={styles.error} maxFontSizeMultiplier={1.8}>
                  {errors.fixedAmount.message}
                </Text>
              ) : null}
            </View>
          )}
        />
      ) : null}

      {pricingModel === 'hourly' ? (
        <>
          <Controller
            control={control}
            name="hourlyRateAmount"
            render={({ field: { value, onChange, onBlur } }) => (
              <View style={styles.field}>
                <TextField
                  label="Tarifa por hora"
                  placeholder="120"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                />
                {errors.hourlyRateAmount ? (
                  <Text style={styles.error} maxFontSizeMultiplier={1.8}>
                    {errors.hourlyRateAmount.message}
                  </Text>
                ) : null}
              </View>
            )}
          />
          <Controller
            control={control}
            name="minimumHours"
            render={({ field: { value, onChange, onBlur } }) => (
              <View style={styles.field}>
                <TextField
                  label="Horas mínimas"
                  hint="por reserva, de 1 a 12"
                  placeholder="2"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                />
                {errors.minimumHours ? (
                  <Text style={styles.error} maxFontSizeMultiplier={1.8}>
                    {errors.minimumHours.message}
                  </Text>
                ) : null}
              </View>
            )}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  step: { gap: 20 },
  section: { gap: 10 },
  field: { gap: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.inkMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { fontSize: 14, color: colors.inkMuted, lineHeight: 20 },
  error: { fontSize: 13, color: colors.danger },
});
