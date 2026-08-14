import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { hasCapacity } from '../../src/domain/models/actor';
import { useAuth } from '../../src/presentation/auth/auth-context';
import { colors } from '../../src/presentation/theme/colors';

const PLATFORM_ROLE_LABELS: Record<string, string> = {
  user: 'Usuario',
  moderator: 'Moderador',
  admin: 'Administrador',
};

// Not part of any numbered historia. Cerca.md's whole point (§ "El giro que hace este proyecto
// distinto") is that an account isn't "a customer" or "a provider" — it's a set of capacities
// that can add up on the same account. This screen exists so that's checkable at a glance
// instead of guessed from which buttons happen to show up on Home.
export default function Profile() {
  const { email, actor } = useAuth();

  const capacityLabel =
    actor && hasCapacity(actor, 'provider')
      ? 'Cliente y proveedor'
      : actor && hasCapacity(actor, 'customer')
        ? 'Cliente'
        : 'Sin capacidades';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title} maxFontSizeMultiplier={1.6}>
          Perfil
        </Text>

        <View style={styles.field}>
          <Text style={styles.label} maxFontSizeMultiplier={1.6}>
            Cuenta
          </Text>
          <Text style={styles.value} maxFontSizeMultiplier={1.8}>
            {email ?? '—'}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label} maxFontSizeMultiplier={1.6}>
            Capacidades
          </Text>
          <Text style={styles.value} maxFontSizeMultiplier={1.8}>
            {capacityLabel}
          </Text>
          <Text style={styles.hint} maxFontSizeMultiplier={1.8}>
            No es un rol fijo — la misma cuenta puede ser cliente y proveedor a la vez. Se agrega
            la capacidad de proveedor al tocar "Convertirme en proveedor" al intentar publicar, y
            no se puede quitar después.
          </Text>
        </View>

        {actor ? (
          <View style={styles.field}>
            <Text style={styles.label} maxFontSizeMultiplier={1.6}>
              Rol de la plataforma
            </Text>
            <Text style={styles.value} maxFontSizeMultiplier={1.8}>
              {PLATFORM_ROLE_LABELS[actor.platformRole] ?? actor.platformRole}
            </Text>
          </View>
        ) : null}

        {actor?.platformRole === 'admin' && (
          <Link href="/(app)/admin-capacities" asChild>
            <TouchableOpacity style={styles.adminButton}>
              <Text style={styles.adminButtonText}>🛡️ Panel de Administración</Text>
            </TouchableOpacity>
          </Link>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 24 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.inkMuted },
  value: { fontSize: 17, fontWeight: '600', color: colors.ink },
  hint: { fontSize: 13, color: colors.inkMuted, lineHeight: 18 },
  adminButton: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  adminButtonText: { fontSize: 16, fontWeight: '700', color: '#92400e' },
});
