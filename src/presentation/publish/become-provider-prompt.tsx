import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/button';
import { colors } from '../theme/colors';
import { useAuth } from '../auth/auth-context';

interface BecomeProviderPromptProps {
  onBecomeProvider: () => void;
}

// "Hacerse proveedora es una acción dentro de la app, no un registro distinto" (Cerca.md) —
// this is that action, shown only to a signed-in customer who tapped "Publicar" without the
// 'provider' capacity yet. It calls the real POST /me/capacities/provider, not a client-side
// pretend toggle: the server is what actually grants `listing:create`.
export function BecomeProviderPrompt({ onBecomeProvider }: BecomeProviderPromptProps) {
  const { becomeProvider } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handlePress() {
    setIsSubmitting(true);
    setErrorMessage(null);
    const result = await becomeProvider();
    setIsSubmitting(false);
    if (result.ok) {
      onBecomeProvider();
    } else {
      setErrorMessage(
        result.reason === 'network_error'
          ? 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.'
          : 'Algo salió mal. Intenta de nuevo en un momento.',
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} maxFontSizeMultiplier={1.6}>
        Conviértete en proveedor
      </Text>
      <Text style={styles.body} maxFontSizeMultiplier={1.8}>
        Para publicar un anuncio necesitas la capacidad de proveedor. Sigues siendo cliente
        también: puedes ofrecer servicios y contratarlos con la misma cuenta.
      </Text>
      {errorMessage ? (
        <Text style={styles.error} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.8}>
          {errorMessage}
        </Text>
      ) : null}
      <Button label="Convertirme en proveedor" onPress={handlePress} loading={isSubmitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center', gap: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, color: colors.inkMuted, lineHeight: 22 },
  error: { fontSize: 14, color: colors.danger },
});
