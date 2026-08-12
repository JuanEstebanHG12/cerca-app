import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { UpdateListingFailureReason } from '../../domain/errors/listing-errors';
import { Listing } from '../../domain/models/listing';
import { fromMinorUnits } from '../../domain/models/money';
import { Button } from '../components/button';
import { Chip } from '../components/chip';
import { TextField } from '../components/text-field';
import { colors } from '../theme/colors';
import {
  CURRENCY_OPTIONS,
  EditListingFormValues,
  PRICING_MODEL_OPTIONS,
  editListingFormSchema,
} from './edit-listing-form-schema';
import { useUpdateListing } from './use-update-listing';

const MODEL_LABELS: Record<(typeof PRICING_MODEL_OPTIONS)[number], string> = {
  fixed: 'Precio fijo',
  hourly: 'Por hora',
  quote: 'Presupuesto',
};

const EDIT_ERROR_MESSAGES: Record<UpdateListingFailureReason, string> = {
  no_capacity: 'No tienes permiso para editar anuncios.',
  not_owner: 'No puedes editar el anuncio de otra persona.',
  removed_by_moderation: 'Este anuncio fue retirado y ya no se puede editar.',
  has_pending_bookings: 'No puedes cambiar el precio mientras tengas una reserva ya aceptada.',
  validation_error: 'Revisa los datos del formulario e intenta de nuevo.',
  not_found: 'No encontramos este anuncio.',
  network_error: 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
  unexpected_error: 'Algo salió mal. Intenta de nuevo en un momento.',
};

// The pricing model's Money always has a concrete amount to seed the form with except 'quote'
// with no `startingFrom` — that case falls back to an empty fixedAmount/hourlyRateAmount the
// user has never had a reason to fill in (switching away from 'quote' is what would surface it).
function toEditFormValues(listing: Listing): EditListingFormValues {
  const { pricing } = listing;
  return {
    title: listing.title,
    description: listing.description,
    pricingModel: pricing.model,
    currency: pricing.model === 'fixed' ? pricing.price.currency : pricing.model === 'hourly' ? pricing.hourlyRate.currency : (pricing.startingFrom?.currency ?? 'COP'),
    fixedAmount: pricing.model === 'fixed' ? String(fromMinorUnits(pricing.price)) : '',
    hourlyRateAmount: pricing.model === 'hourly' ? String(fromMinorUnits(pricing.hourlyRate)) : '',
    minimumHours: pricing.model === 'hourly' ? String(pricing.minimumHours) : '',
  };
}

interface EditListingFormProps {
  listing: Listing;
  onSaved: () => void;
}

// One page, not a wizard: PATCH /listings/{id} only ever touches title/description/pricing
// (no category, location or photos), so there's no reason to split this into steps the way
// publishing is. See to-update-listing-input.ts for why only *changed* fields are sent.
export function EditListingForm({ listing, onSaved }: EditListingFormProps) {
  const updateListing = useUpdateListing(listing.id);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<EditListingFormValues>({
    resolver: zodResolver(editListingFormSchema),
    defaultValues: toEditFormValues(listing),
    mode: 'onBlur',
  });
  const pricingModel = useWatch({ control: form.control, name: 'pricingModel' });
  // react-hook-form's `formState` is a Proxy that only starts tracking a given key once it's
  // read during render — reading `form.formState.dirtyFields` for the first time inside
  // `onSubmit` (an event handler, not render) meant it was never subscribed and always came
  // back `{}`. Destructuring it here, in the render body, is what turns tracking on.
  const { dirtyFields } = form.formState;

  async function onSubmit(values: EditListingFormValues) {
    setSubmitError(null);
    if (Object.keys(dirtyFields).length === 0) {
      // Nothing changed — no reason to round-trip a PATCH with an empty body.
      onSaved();
      return;
    }
    const result = await updateListing.mutateAsync({ values, dirtyFields });
    if (result.ok) {
      onSaved();
    } else {
      setSubmitError(EDIT_ERROR_MESSAGES[result.reason]);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Controller
          control={form.control}
          name="title"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={styles.field}>
              <TextField label="Título" value={value} onChangeText={onChange} onBlur={onBlur} maxLength={120} />
              {form.formState.errors.title ? (
                <Text style={styles.error} maxFontSizeMultiplier={1.8}>
                  {form.formState.errors.title.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={form.control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={styles.field}>
              <TextField
                label="Descripción"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={5}
                style={styles.multiline}
                maxLength={4000}
              />
              {form.formState.errors.description ? (
                <Text style={styles.error} maxFontSizeMultiplier={1.8}>
                  {form.formState.errors.description.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.6}>
            Modelo de precio
          </Text>
          <Controller
            control={form.control}
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

        {pricingModel !== 'quote' ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.6}>
              Moneda
            </Text>
            <Controller
              control={form.control}
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
        ) : null}

        {pricingModel === 'fixed' ? (
          <Controller
            control={form.control}
            name="fixedAmount"
            render={({ field: { value, onChange, onBlur } }) => (
              <View style={styles.field}>
                <TextField label="Precio" value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="decimal-pad" />
                {form.formState.errors.fixedAmount ? (
                  <Text style={styles.error} maxFontSizeMultiplier={1.8}>
                    {form.formState.errors.fixedAmount.message}
                  </Text>
                ) : null}
              </View>
            )}
          />
        ) : null}

        {pricingModel === 'hourly' ? (
          <>
            <Controller
              control={form.control}
              name="hourlyRateAmount"
              render={({ field: { value, onChange, onBlur } }) => (
                <View style={styles.field}>
                  <TextField label="Tarifa por hora" value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="decimal-pad" />
                  {form.formState.errors.hourlyRateAmount ? (
                    <Text style={styles.error} maxFontSizeMultiplier={1.8}>
                      {form.formState.errors.hourlyRateAmount.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />
            <Controller
              control={form.control}
              name="minimumHours"
              render={({ field: { value, onChange, onBlur } }) => (
                <View style={styles.field}>
                  <TextField
                    label="Horas mínimas"
                    hint="por reserva, de 1 a 12"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                  />
                  {form.formState.errors.minimumHours ? (
                    <Text style={styles.error} maxFontSizeMultiplier={1.8}>
                      {form.formState.errors.minimumHours.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />
          </>
        ) : null}

        {submitError ? (
          <Text style={styles.submitError} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.8}>
            {submitError}
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Guardar cambios"
          onPress={form.handleSubmit(onSubmit)}
          loading={updateListing.isPending}
          style={styles.footerButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 20 },
  field: { gap: 8 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.inkMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  multiline: { minHeight: 110, textAlignVertical: 'top', paddingTop: 12 },
  error: { fontSize: 13, color: colors.danger },
  submitError: { fontSize: 14, color: colors.danger },
  footer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: colors.surfaceBorder },
  footerButton: { flex: 1 },
});
