import { ActivityIndicator, Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
}

// The two button looks the app needs: 'primary' (filled, accent) for the one submit action a
// screen is built around, 'secondary' (outlined) for a lower-emphasis action like signing out.
export function Button({ label, onPress, disabled, loading, variant = 'primary', style }: ButtonProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.accentInk : colors.ink} />
      ) : (
        <Text
          style={isPrimary ? styles.primaryLabel : styles.secondaryLabel}
          maxFontSizeMultiplier={1.6}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: { backgroundColor: colors.accent },
  secondary: { borderWidth: 1, borderColor: colors.surfaceBorder },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accentInk,
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
});
