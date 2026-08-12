import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/presentation/auth/auth-context';
import { colors } from '../../src/presentation/theme/colors';
import { SignOutButton } from '../../src/presentation/auth/sign-out-button';
import { LinkButton } from '../../src/presentation/components/link-button';

// Placeholder home screen: it exists to prove US-01 end to end. Kill the app here, reopen it,
// and this is what should show up again — no login screen in between.
export default function Home() {
  const { actor } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title} maxFontSizeMultiplier={1.6}>
        Sesión activa
      </Text>
      <Text style={styles.detail} maxFontSizeMultiplier={1.8}>
        ID: {actor?.id}
      </Text>
      <Text style={styles.detail} maxFontSizeMultiplier={1.8}>
        Capacidades: {actor?.capacities.join(', ') || '—'}
      </Text>
      <Text style={styles.detail} maxFontSizeMultiplier={1.8}>
        Rol de plataforma: {actor?.platformRole}
      </Text>
      <LinkButton
        prompt="US-07:"
        actionLabel="ver precios y distancia por locale"
        onPress={() => router.push('/locale-preview')}
      />
      <LinkButton
        prompt="US-08:"
        actionLabel="ubicación con degradación elegante"
        onPress={() => router.push('/location-demo')}
      />
      <SignOutButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  detail: { fontSize: 15, color: colors.inkMuted },
});
