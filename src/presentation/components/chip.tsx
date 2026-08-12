import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

// The single-choice chip look used for category/radius in FiltersSheet and, since US-03, for
// the publish wizard's category and pricing-model pickers — pulled out once it was needed in
// a second place, not before.
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]} maxFontSizeMultiplier={1.6}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  labelSelected: { color: colors.accentInk },
});
