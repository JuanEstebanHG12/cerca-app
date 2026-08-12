import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RADIUS_OPTIONS_KM } from '../../domain/models/search-filters';
import { Button } from '../components/button';
import { TextField } from '../components/text-field';
import { colors } from '../theme/colors';
import { useCategories } from './use-categories';

export interface FilterDraft {
  query: string;
  categoryId?: string;
  radiusKm: number;
}

interface FiltersSheetProps {
  visible: boolean;
  initial: FilterDraft;
  onApply: (draft: FilterDraft) => void;
  onClose: () => void;
}

// A local draft, committed only on "Aplicar" — editing filters shouldn't refetch on every
// keystroke or chip tap, only once the user says they're done.
export function FiltersSheet({ visible, initial, onApply, onClose }: FiltersSheetProps) {
  const [draft, setDraft] = useState(initial);
  const categories = useCategories();

  useEffect(() => {
    if (visible) setDraft(initial);
  }, [visible, initial]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} maxFontSizeMultiplier={1.6}>
            Filtros
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar filtros" hitSlop={12}>
            <Text style={styles.close} maxFontSizeMultiplier={1.6}>
              Cerrar
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <TextField
            label="Buscar"
            hint="opcional"
            placeholder="Fontanero, clases de guitarra…"
            value={draft.query}
            onChangeText={(query) => setDraft((d) => ({ ...d, query }))}
            returnKeyType="search"
          />

          <View style={styles.section}>
            <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.6}>
              Categoría
            </Text>
            <View style={styles.chipRow}>
              <Chip
                label="Todas"
                selected={!draft.categoryId}
                onPress={() => setDraft((d) => ({ ...d, categoryId: undefined }))}
              />
              {categories.data?.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  selected={draft.categoryId === category.id}
                  onPress={() => setDraft((d) => ({ ...d, categoryId: category.id }))}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.6}>
              Radio
            </Text>
            <View style={styles.chipRow}>
              {RADIUS_OPTIONS_KM.map((radiusKm) => (
                <Chip
                  key={radiusKm}
                  label={`${radiusKm} km`}
                  selected={draft.radiusKm === radiusKm}
                  onPress={() => setDraft((d) => ({ ...d, radiusKm }))}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Limpiar filtros"
            variant="secondary"
            onPress={() => setDraft({ query: '', categoryId: undefined, radiusKm: initial.radiusKm })}
            style={styles.footerButton}
          />
          <Button label="Aplicar" onPress={() => onApply(draft)} style={styles.footerButton} />
        </View>
      </View>
    </Modal>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]} maxFontSizeMultiplier={1.6}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.ink },
  close: { fontSize: 15, fontWeight: '600', color: colors.accent },
  content: { padding: 20, gap: 24 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.inkMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },
  chipLabelSelected: { color: colors.accentInk },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  footerButton: { flex: 1 },
});
