import { useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../src/presentation/auth/auth-context';
import { colors } from '../../src/presentation/theme/colors';
import { SignInFailureReason } from '../../src/domain/errors/auth-errors';
import { ScreenHeader } from '../../src/presentation/components/screen-header';
import { TextField } from '../../src/presentation/components/text-field';
import { Button } from '../../src/presentation/components/button';
import { LinkButton } from '../../src/presentation/components/link-button';

// This will become `t('auth.error.${reason}')` once i18next is wired in (Cerca.md: "el motivo
// es una clave de i18n") — the use case already hands back a reason, not a boolean, so that
// swap won't touch any logic, only this lookup table.
const ERROR_MESSAGES: Record<SignInFailureReason, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  network_error: 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
  unexpected_error: 'Algo salió mal. Intenta de nuevo en un momento.',
};

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  async function handleSubmit() {
    if (isSubmitting) return; // Guards against a double-tap firing two requests.
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await signIn(email.trim(), password);
      if (!result.ok) {
        const message = ERROR_MESSAGES[result.reason];
        setErrorMessage(message);
        // VoiceOver/TalkBack won't discover the new error text on its own since focus never
        // moves there — this is what "Anunciar el primer error" actually requires on native.
        AccessibilityInfo.announceForAccessibility(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Cerca" tagline="Servicios de confianza, cerca de ti" mark />

        <View style={styles.form}>
          <TextField
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <TextField
            ref={passwordRef}
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
          />

          {errorMessage ? (
            <Text
              style={styles.error}
              accessibilityLiveRegion="polite"
              maxFontSizeMultiplier={1.8}
            >
              {errorMessage}
            </Text>
          ) : null}

          <Button label="Iniciar sesión" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />

          <LinkButton
            prompt="¿No tienes cuenta?"
            actionLabel="Regístrate"
            onPress={() => router.push('/sign-up')}
            disabled={isSubmitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
    gap: 40,
  },
  form: { gap: 18 },
  error: {
    color: colors.danger,
    fontSize: 14,
  },
});
