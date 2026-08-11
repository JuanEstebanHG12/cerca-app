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
import { SignUpFailureReason } from '../../src/domain/errors/auth-errors';
import { ScreenHeader } from '../../src/presentation/components/screen-header';
import { TextField } from '../../src/presentation/components/text-field';
import { Button } from '../../src/presentation/components/button';
import { LinkButton } from '../../src/presentation/components/link-button';

const ERROR_MESSAGES: Record<SignUpFailureReason, string> = {
  email_taken: 'Ya existe una cuenta con ese correo.',
  network_error: 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
  unexpected_error: 'Algo salió mal. Intenta de nuevo en un momento.',
};

export default function SignUp() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  async function handleSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await signUp(email.trim(), password, displayName.trim());
      if (!result.ok) {
        const message = ERROR_MESSAGES[result.reason];
        setErrorMessage(message);
        AccessibilityInfo.announceForAccessibility(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Mirrors the backend's own floor (packages/contract signUpSchema: password min 8) — catching
  // it here means the field turns red before the request round-trip, not after.
  const canSubmit =
    displayName.trim().length > 0 && email.trim().length > 0 && password.length >= 8 && !isSubmitting;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Crea tu cuenta" tagline="Servicios de confianza, cerca de ti" />

        <View style={styles.form}>
          <TextField
            label="Nombre"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Tu nombre"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <TextField
            ref={emailRef}
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
            hint="Mínimo 8 caracteres"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
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

          <Button label="Crear cuenta" onPress={handleSubmit} disabled={!canSubmit} loading={isSubmitting} />

          <LinkButton
            prompt="¿Ya tienes cuenta?"
            actionLabel="Inicia sesión"
            onPress={() => router.back()}
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
