import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

// Signature mark: three concentric rings standing in for a search radius — "cerca" (near) is
// the whole product thesis, so the wordmark is built out of that idea instead of a generic logo.
export function ProximityMark() {
  return (
    <View style={styles.outer}>
      <View style={styles.middle}>
        <View style={styles.inner} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.accent,
    opacity: 0.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.accent,
  },
});
