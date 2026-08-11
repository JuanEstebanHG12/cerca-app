import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../theme/colors';

interface TextFieldProps extends TextInputProps {
  label: string;
  hint?: string;
}

// Every screen's text input, wrapped once: label, optional hint, and the placeholder color /
// max font scale that every field in the app was repeating individually before this existed.
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, hint, style, ...inputProps },
  ref,
) {
  return (
    <View style={styles.field}>
      <Text style={styles.label} maxFontSizeMultiplier={1.6}>
        {label}
        {hint ? <Text style={styles.hint}> · {hint}</Text> : null}
      </Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.inkMuted}
        maxFontSizeMultiplier={1.6}
        style={[styles.input, style]}
        {...inputProps}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  hint: { fontWeight: '400' },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
  },
});
