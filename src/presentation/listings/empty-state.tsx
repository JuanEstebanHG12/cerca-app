import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/button';
import { colors } from '../theme/colors';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  title: string;
  message?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
}

// One shape, four callers: the network error, the "nobody's listed here yet", and the
// "your filters are too narrow" screens are all this component with different copy and
// actions — a dead end always ships with a way out, never just an apology (Cerca.md: "un
// botón de 'ampliar a 20 km' convierte un callejón sin salida en una acción").
export function EmptyState({ title, message, primaryAction, secondaryAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} maxFontSizeMultiplier={1.6}>
        {title}
      </Text>
      {message ? (
        <Text style={styles.message} maxFontSizeMultiplier={1.8}>
          {message}
        </Text>
      ) : null}
      {primaryAction ? (
        <Button label={primaryAction.label} onPress={primaryAction.onPress} style={styles.action} />
      ) : null}
      {secondaryAction ? (
        <Button
          label={secondaryAction.label}
          onPress={secondaryAction.onPress}
          variant="secondary"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  title: { fontSize: 17, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  message: { fontSize: 14, color: colors.inkMuted, textAlign: 'center' },
  action: { marginTop: 8, alignSelf: 'stretch' },
});
