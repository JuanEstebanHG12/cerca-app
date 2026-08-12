import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CityPicker } from '../../src/presentation/components/city-picker';
import { useSearchOrigin } from '../../src/presentation/location/use-search-origin';
import { findCity } from '../../src/domain/models/city';
import { colors } from '../../src/presentation/theme/colors';

// US-08 acceptance criterion: "al negar la ubicación, la app ofrece un selector de ciudad en
// vez de quedarse en blanco". This screen is the proof — deny the permission (or turn GPS
// off) and, instead of an empty screen, a city list appears right where the map/results
// would normally start.
export default function LocationDemo() {
  const { state, retryLocation, selectCity } = useSearchOrigin();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.back}>
        <Text style={styles.backLabel} maxFontSizeMultiplier={1.6}>
          ‹ Volver
        </Text>
      </Pressable>

      <Text style={styles.title} maxFontSizeMultiplier={1.4}>
        Ubicación con degradación elegante
      </Text>
      <Text style={styles.tagline} maxFontSizeMultiplier={1.6}>
        Sin permiso de ubicación, la búsqueda sigue funcionando: eliges una ciudad.
      </Text>

      {state.phase === 'loading' && (
        <View style={styles.statusCard}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.statusText} maxFontSizeMultiplier={1.6}>
            Buscando tu ubicación…
          </Text>
        </View>
      )}

      {state.phase === 'coords' && (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle} maxFontSizeMultiplier={1.6}>
            Ubicación detectada
          </Text>
          <Text style={styles.statusText} maxFontSizeMultiplier={1.6}>
            {state.coords.lat.toFixed(4)}, {state.coords.lng.toFixed(4)}
          </Text>
        </View>
      )}

      {state.phase === 'needs-city' && (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle} maxFontSizeMultiplier={1.6}>
            {state.reason === 'denied' ? 'No compartiste tu ubicación' : 'No pudimos obtener tu ubicación'}
          </Text>
          <Text style={styles.statusText} maxFontSizeMultiplier={1.6}>
            {state.reason === 'denied'
              ? 'Elige una ciudad para seguir buscando servicios cerca de ti.'
              : 'Puede que el GPS esté apagado. Elige una ciudad mientras tanto.'}
          </Text>
        </View>
      )}

      {state.phase === 'city' && (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle} maxFontSizeMultiplier={1.6}>
            Buscando cerca de {findCity(state.cityId)?.name}
          </Text>
          <Text style={styles.statusText} maxFontSizeMultiplier={1.6}>
            Ciudad elegida a mano, sin usar el GPS.
          </Text>
        </View>
      )}

      {state.phase !== 'coords' && state.phase !== 'loading' && (
        <Pressable onPress={retryLocation} accessibilityRole="button" style={styles.retry}>
          <Text style={styles.retryLabel} maxFontSizeMultiplier={1.6}>
            Reintentar con mi ubicación
          </Text>
        </Pressable>
      )}

      <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.6}>
        O elige una ciudad a mano
      </Text>
      <CityPicker
        onSelect={selectCity}
        selectedCityId={state.phase === 'city' ? state.cityId : undefined}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 16, paddingBottom: 48 },
  back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  backLabel: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink },
  tagline: { fontSize: 15, color: colors.inkMuted },
  statusCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  statusTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  statusText: { fontSize: 14, color: colors.inkMuted },
  retry: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  retryLabel: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.ink, marginTop: 8 },
});
