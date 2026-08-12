import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CITIES } from '../../domain/models/city';
import { colors } from '../theme/colors';

interface CityPickerProps {
  onSelect: (cityId: string) => void;
  selectedCityId?: string;
}

// The fallback that replaces a blank screen when there's no device location (US-08): a plain
// list of the cities the backend actually recognizes as a `cityId` (US-08's other half,
// city-coordinates.ts in cerca-api) — picking one not in that table would be a dead end.
export function CityPicker({ onSelect, selectedCityId }: CityPickerProps) {
  return (
    <View style={styles.list}>
      {CITIES.map((city) => {
        const selected = city.id === selectedCityId;
        return (
          <Pressable
            key={city.id}
            onPress={() => onSelect(city.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.row, selected && styles.rowSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]} maxFontSizeMultiplier={1.6}>
              {city.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: 'center',
  },
  rowSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  label: { fontSize: 15, fontWeight: '600', color: colors.ink },
  labelSelected: { color: colors.accentInk },
});
