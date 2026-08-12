import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { hasCapacity } from '../../domain/models/actor';
import { useAuth } from '../auth/auth-context';
import { Button } from '../components/button';
import { colors } from '../theme/colors';
import { BecomeProviderPrompt } from './become-provider-prompt';
import { PUBLISH_FORM_DEFAULTS, publishFormSchema, PublishFormValues, STEP_FIELDS } from './publish-form-schema';
import { PublishStepBasics } from './publish-step-basics';
import { PublishStepLocation } from './publish-step-location';
import { PublishStepPhotos } from './publish-step-photos';
import { PublishStepPricing } from './publish-step-pricing';
import { useCreateListing } from './use-create-listing';
import { usePublishDraft } from './use-publish-draft';

const STEP_TITLES = ['Datos básicos', 'Precio', 'Ubicación', 'Fotos'];
const LAST_STEP = STEP_TITLES.length - 1;

const SUBMIT_ERROR_MESSAGES: Record<string, string> = {
  forbidden: 'No tienes permiso para publicar. Vuelve a intentarlo o contacta soporte.',
  validation_error: 'Revisa los datos del formulario e intenta de nuevo.',
  not_found: 'No encontramos el anuncio para publicarlo. Intenta de nuevo.',
  network_error: 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
  unexpected_error: 'Algo salió mal. Intenta de nuevo en un momento.',
};

// Gate first, wizard second: `listing:create` requires the 'provider' capacity (Cerca.md's
// permission matrix), and becoming one is an in-app action, not a separate sign-up. This is a
// UX convenience only — the server re-checks the capacity on every POST /listings regardless.
export function PublishWizard() {
  const { actor } = useAuth();
  const [isProvider, setIsProvider] = useState(() => (actor ? hasCapacity(actor, 'provider') : false));

  if (!isProvider) {
    return <BecomeProviderPrompt onBecomeProvider={() => setIsProvider(true)} />;
  }

  return <PublishWizardForm />;
}

function PublishWizardForm() {
  const draft = usePublishDraft();
  const createListing = useCreateListing();
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Set only when the listing published but some/all photos didn't upload — distinct from
  // submitError (which blocks the wizard mid-flow): the listing already exists and is live, so
  // this is a heads-up on the way out, not a reason to keep the user stuck on this screen.
  const [photosWarning, setPhotosWarning] = useState<string | null>(null);

  const form = useForm<PublishFormValues>({
    resolver: zodResolver(publishFormSchema),
    defaultValues: PUBLISH_FORM_DEFAULTS,
    mode: 'onBlur',
  });

  // Reset once the draft finishes loading, so the first paint already has the final values —
  // avoids resetting a form the user might already be typing into.
  useEffect(() => {
    if (!draft.isLoading && draft.initialValues) {
      form.reset(draft.initialValues);
    }
    // form.reset is stable across renders (react-hook-form); re-running only on the loading
    // transition is deliberate, not a missed dependency.
  }, [draft.isLoading]);

  // Debounced autosave: "el borrador se puede retomar" means surviving the app closing
  // mid-wizard, not synchronizing every keystroke to disk.
  useEffect(() => {
    const subscription = form.watch((values) => {
      const timer = setTimeout(() => draft.save(values as PublishFormValues), 400);
      return () => clearTimeout(timer);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  if (draft.isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  async function goNext() {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (valid) setStep((current) => Math.min(current + 1, LAST_STEP));
  }

  function goBack() {
    if (step === 0) {
      router.back();
    } else {
      setStep((current) => Math.max(current - 1, 0));
    }
  }

  async function onSubmit(values: PublishFormValues) {
    setSubmitError(null);
    const outcome = await createListing.mutateAsync(values);
    if (outcome.ok) {
      await draft.clear();
      if (outcome.photosFailed > 0) {
        // The listing is already live — navigating away silently would hide that its photos
        // didn't make it. Stay one more beat and say so plainly instead of pretending they did.
        setPhotosWarning(
          outcome.photosFailed === 1
            ? 'Publicamos tu anuncio, pero 1 foto no se pudo subir. Podrás agregarla más adelante.'
            : `Publicamos tu anuncio, pero ${outcome.photosFailed} fotos no se pudieron subir. Podrás agregarlas más adelante.`,
        );
      } else {
        router.back();
      }
    } else {
      setSubmitError(SUBMIT_ERROR_MESSAGES[outcome.reason] ?? SUBMIT_ERROR_MESSAGES.unexpected_error);
    }
  }

  function onInvalid() {
    // Only reachable if a field from an earlier, already-passed step somehow went invalid
    // (e.g. cleared via the draft) without the user revisiting it — trigger() on each step
    // change should normally prevent this. Better an explicit message than a submit button
    // that silently does nothing.
    setSubmitError('Revisa los pasos anteriores, falta algún dato.');
  }

  if (photosWarning) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title} maxFontSizeMultiplier={1.6}>
            Anuncio publicado
          </Text>
          <Text style={styles.photosWarning} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.8}>
            {photosWarning}
          </Text>
        </View>
        <View style={styles.footer}>
          <Button label="Volver" onPress={() => router.back()} style={styles.footerButton} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} maxFontSizeMultiplier={1.6}>
          {STEP_TITLES[step]}
        </Text>
        <Text style={styles.progress} maxFontSizeMultiplier={1.6}>
          Paso {step + 1} de {STEP_TITLES.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 0 ? <PublishStepBasics control={form.control} errors={form.formState.errors} /> : null}
        {step === 1 ? <PublishStepPricing control={form.control} errors={form.formState.errors} /> : null}
        {step === 2 ? (
          <PublishStepLocation control={form.control} errors={form.formState.errors} setValue={form.setValue} />
        ) : null}
        {step === 3 ? <PublishStepPhotos control={form.control} /> : null}

        {submitError ? (
          <Text style={styles.submitError} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.8}>
            {submitError}
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={step === 0 ? 'Cancelar' : 'Atrás'}
          variant="secondary"
          onPress={goBack}
          disabled={createListing.isPending}
          style={styles.footerButton}
        />
        {step < LAST_STEP ? (
          <Button label="Siguiente" onPress={goNext} style={styles.footerButton} />
        ) : (
          <Button
            label="Publicar"
            onPress={form.handleSubmit(onSubmit, onInvalid)}
            loading={createListing.isPending}
            style={styles.footerButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, gap: 4, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink },
  progress: { fontSize: 13, color: colors.inkMuted },
  content: { padding: 20, gap: 20 },
  submitError: { fontSize: 14, color: colors.danger },
  photosWarning: { fontSize: 15, color: colors.warning, lineHeight: 22, marginTop: 12 },
  footer: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: colors.surfaceBorder },
  footerButton: { flex: 1 },
});
