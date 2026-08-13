import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ListingSearchResult, ListingStatus } from '../../domain/models/listing';
import { colors } from '../theme/colors';
import { formatDistance, formatPriceFromLabel, formatRatingSummary, statusBadgeLabel } from './format-listing';

export const LISTING_CARD_HEIGHT = 112;

interface ListingCardProps {
  listing: ListingSearchResult;
  // Owned by Home (US-07's format picker), not detected per-card: every card in the list has
  // to agree on one format, and re-deriving the device locale inside each of 5,000 cards would
  // also defeat their own memo() the moment the OS locale hook re-renders.
  locale: string;
  onPress: (id: string) => void;
}

// memo() only pays off if the parent's renderItem and press handlers are themselves stable
// (Cerca.md: "las tres estabilizaciones, o memo() no sirve de nada") — `onPress` here must be
// the parent's stabilized callback, not an inline arrow, or every render invalidates memo().
export const ListingCard = memo(function ListingCard({ listing, locale, onPress }: ListingCardProps) {
  const price = formatPriceFromLabel(listing.priceFrom, locale);
  const badge = statusBadgeLabel(listing.status);
  const ratingSummary = formatRatingSummary(listing.ratingAvg, listing.ratingCount);
  const distance = formatDistance(listing.distanceMeters, locale);

  // One accessible group per card: without this a screen reader stops at the image, the
  // title, the price, and the meta row separately — 5,000 results become 20,000 stops.
  const accessibilityLabel = [listing.title, price.amount, price.context, ratingSummary, distance, badge]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={() => onPress(listing.id)}
      accessibilityRole="button"
      accessible
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Search results carry no photo (GET /listings doesn't return one) — this stays a
          plain placeholder until the backend contract adds photoUrl. */}
      <View style={styles.photo} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={1.8}>
            {listing.title}
          </Text>
          {badge ? (
            <View style={badgeStyle(listing.status)}>
              <Text style={styles.badgeText} maxFontSizeMultiplier={1.6}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.priceRow} numberOfLines={1} maxFontSizeMultiplier={1.8}>
          <Text style={styles.priceAmount}>{price.amount}</Text>
          {price.context ? <Text style={styles.priceContext}> {price.context}</Text> : null}
        </Text>

        <Text style={styles.meta} numberOfLines={1} maxFontSizeMultiplier={1.8}>
          {ratingSummary} · {distance}
        </Text>
      </View>
    </Pressable>
  );
});

function badgeStyle(status: ListingStatus) {
  const tone = status === 'removed' ? styles.badgeDanger : styles.badgeWarning;
  return [styles.badge, tone];
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
  cardPressed: { opacity: 0.7 },
  photo: {
    width: 88,
    height: 88,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  body: { flex: 1, justifyContent: 'center', gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.ink },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeWarning: { backgroundColor: colors.warning },
  badgeDanger: { backgroundColor: colors.danger },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.warningInk },
  priceRow: { fontSize: 15 },
  priceAmount: { fontWeight: '700', color: colors.accent },
  priceContext: { fontSize: 13, fontWeight: '400', color: colors.inkMuted },
  meta: { fontSize: 13, color: colors.inkMuted },
});
