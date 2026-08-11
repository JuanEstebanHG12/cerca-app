import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

interface LinkButtonProps {
  prompt: string;
  actionLabel: string;
  onPress: () => void;
  disabled?: boolean;
}

// The "already have an account? / don't have one?" pattern: a quiet prompt with an accent-
// colored call to action, used to move between sign-in and sign-up without leaving the flow.
export function LinkButton({ prompt, actionLabel, onPress, disabled }: LinkButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" style={styles.button}>
      <Text style={styles.text} maxFontSizeMultiplier={1.6}>
        {prompt} <Text style={styles.accent}>{actionLabel}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    color: colors.inkMuted,
  },
  accent: {
    color: colors.accent,
    fontWeight: '600',
  },
});
