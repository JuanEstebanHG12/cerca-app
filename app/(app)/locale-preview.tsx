import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Distance } from '../../src/presentation/components/distance';
import { Price } from '../../src/presentation/components/price';
import { colors } from '../../src/presentation/theme/colors';
import { useDeviceLocale } from '../../src/infrastructure/locale/device-locale';
import type { Money } from '../../src/domain/models/money';

// US-07 acceptance criterion: "el mismo precio se ve bien en es-MX, en-US y de-DE; la
// distancia en km o millas según locale". These three are hardcoded on purpose — this screen
// exists to *prove* the formatting is locale-driven, by rendering the exact same `Money` and
// `distanceMeters` three times and letting you flip between them, instead of asking whoever
// is reviewing this to go change their phone's system language three times.
const PREVIEW_LOCALES = ['es-MX', 'en-US', 'de-DE'] as const;

const SAMPLE_FIXED_PRICE: Money = { amountMinor: 129990, currency: 'MXN' };
const SAMPLE_HOURLY_RATE: Money = { amountMinor: 45000, currency: 'USD' };
const SAMPLE_DISTANCE_METERS = 3200;

export default function LocalePreview() {
  const deviceLocale = useDeviceLocale();
  const [selectedLocale, setSelectedLocale] = useState<string>(PREVIEW_LOCALES[0]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.back}>
        <Text style={styles.backLabel} maxFontSizeMultiplier={1.6}>
          ‹ Volver
        </Text>
      </Pressable>

      <Text style={styles.title} maxFontSizeMultiplier={1.4}>
        Precio y distancia por locale
      </Text>
      <Text style={styles.tagline} maxFontSizeMultiplier={1.6}>
        Mismo anuncio, mismo dato de distancia. Solo cambia el locale.
      </Text>

      <Text style={styles.deviceLocale} maxFontSizeMultiplier={1.6}>
        Locale de tu dispositivo: {deviceLocale}
      </Text>

      <View style={styles.localeRow}>
        {PREVIEW_LOCALES.map((locale) => {
          const selected = locale === selectedLocale;
          return (
            <Pressable
              key={locale}
              onPress={() => setSelectedLocale(locale)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.localeChip, selected && styles.localeChipSelected]}
            >
              <Text
                style={[styles.localeChipLabel, selected && styles.localeChipLabelSelected]}
                maxFontSizeMultiplier={1.6}
              >
                {locale}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle} maxFontSizeMultiplier={1.6}>
          Corte de cabello a domicilio
        </Text>
        <Price money={SAMPLE_FIXED_PRICE} localeOverride={selectedLocale} style={styles.price} />
        <Text style={styles.cardMeta} maxFontSizeMultiplier={1.6}>
          Precio fijo · MXN 129990 (centavos)
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle} maxFontSizeMultiplier={1.6}>
          Clases de guitarra
        </Text>
        <Price money={SAMPLE_HOURLY_RATE} localeOverride={selectedLocale} style={styles.price} />
        <Text style={styles.cardMeta} maxFontSizeMultiplier={1.6}>
          Por hora · mínimo 2 h · USD 45000 (centavos)
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle} maxFontSizeMultiplier={1.6}>
          Distancia hasta el anuncio
        </Text>
        <Distance meters={SAMPLE_DISTANCE_METERS} localeOverride={selectedLocale} style={styles.price} />
        <Text style={styles.cardMeta} maxFontSizeMultiplier={1.6}>
          {SAMPLE_DISTANCE_METERS} m enviados por el servidor, sin unidad
        </Text>
      </View>
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
  deviceLocale: { fontSize: 13, color: colors.inkMuted },
  localeRow: { flexDirection: 'row', gap: 8 },
  localeChip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  localeChipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  localeChipLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },
  localeChipLabelSelected: { color: colors.accentInk },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  price: { fontSize: 20, fontWeight: '700', color: colors.accent },
  cardMeta: { fontSize: 13, color: colors.inkMuted },
});
