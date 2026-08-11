import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { ProximityMark } from './proximity-mark';

interface ScreenHeaderProps {
  title: string;
  tagline: string;
  // Only the true landing moment (sign-in) shows the brand mark; screens reached by
  // navigating deeper (sign-up, and future ones) use this as a plain page heading instead.
  mark?: boolean;
}

export function ScreenHeader({ title, tagline, mark = false }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {mark ? <ProximityMark /> : null}
      <Text style={styles.title} maxFontSizeMultiplier={1.4}>
        {title}
      </Text>
      <Text style={styles.tagline} maxFontSizeMultiplier={1.6}>
        {tagline}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 15,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
