import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { LISTING_CARD_HEIGHT } from './listing-card';

// Shaped like the real card (same photo box, same three text lines) so loading previews the
// layout that's about to appear, instead of a spinner that tells the user nothing (Cerca.md:
// "el skeleton comunica qué va a aparecer").
export function ListingCardSkeleton() {
  return (
    <View style={styles.card} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.photo} />
      <View style={styles.body}>
        <View style={[styles.line, { width: '70%' }]} />
        <View style={[styles.line, { width: '40%' }]} />
        <View style={[styles.line, { width: '55%' }]} />
      </View>
    </View>
  );
}

export function ListingListSkeleton() {
  return (
    <View>
      {Array.from({ length: 6 }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: LISTING_CARD_HEIGHT,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  photo: { width: 88, height: 88, borderRadius: 10, backgroundColor: colors.surface },
  body: { flex: 1, justifyContent: 'center', gap: 10 },
  line: { height: 12, borderRadius: 6, backgroundColor: colors.surface },
});
