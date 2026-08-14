import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SuspendUserFailureReason } from '../../src/domain/errors/user-errors';
import { Button } from '../../src/presentation/components/button';
import { TextField } from '../../src/presentation/components/text-field';
import { colors } from '../../src/presentation/theme/colors';
import { useSuspendUser } from '../../src/presentation/users/use-suspend-user';

const SUSPEND_ERROR_MESSAGES: Record<SuspendUserFailureReason, string> = {
  no_capacity: 'No tienes permiso para suspender usuarios.',
  not_found: 'No encontramos ningún usuario con ese ID.',
  network_error: 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
  unexpected_error: 'Algo salió mal. Intenta de nuevo en un momento.',
};

// Scoped down from an earlier version of this screen that assumed an admin could list every
// account and toggle its capacities — cerca-api has neither a GET /users nor a way to change
// someone else's capacities. The only real admin lever over another account today is
// POST /users/:id/suspend (users.controller.ts), so that's the entire screen: paste the user's
// id, suspend it. No unsuspend either — the endpoint doesn't exist yet, even though the
// repository underneath it already supports clearing suspendedAt.
export default function AdminCapacitiesScreen() {
  const [userId, setUserId] = useState('');
  const suspendUser = useSuspendUser();

  const trimmedId = userId.trim();
  const result = suspendUser.data;

  function handleSuspend() {
    if (!trimmedId) return;
    suspendUser.mutate(trimmedId);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} maxFontSizeMultiplier={1.6}>
          🛡️ Suspender usuario
        </Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.8}>
          Pega el ID del usuario y confirma. Un usuario suspendido no puede iniciar sesión.
        </Text>

        <TextField
          label="ID del usuario"
          hint="UUID"
          value={userId}
          onChangeText={(value) => {
            setUserId(value);
            suspendUser.reset();
          }}
          placeholder="00000000-0000-0000-0000-000000000000"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          label="Suspender usuario"
          onPress={handleSuspend}
          disabled={!trimmedId}
          loading={suspendUser.isPending}
        />

        {result ? (
          <View style={styles.feedback}>
            {result.ok ? (
              <Text style={styles.success} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.8}>
                Usuario suspendido.
              </Text>
            ) : (
              <Text style={styles.error} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.8}>
                {SUSPEND_ERROR_MESSAGES[result.reason]}
              </Text>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 14, color: colors.inkMuted, lineHeight: 20 },
  feedback: { marginTop: 4 },
  success: { fontSize: 14, color: colors.ink, fontWeight: '600' },
  error: { fontSize: 14, color: colors.danger },
});
