import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Listing } from '../../domain/listing';
import { formatMoney, formatDistance } from '../../domain/money';
import { useTranslation } from 'react-i18next';

export interface ListingCardProps {
  listing: Listing;
  onPress: (id: string) => void;
  locale?: string;
}

export const ListingCard: React.FC<ListingCardProps> = React.memo(({ listing, onPress, locale = 'es-MX' }) => {
  const { t } = useTranslation();

  const renderPrice = () => {
    const p = listing.pricing;
    if (p.model === 'fixed') {
      return formatMoney(p.price, locale);
    }
    if (p.model === 'hourly') {
      return `${formatMoney(p.hourlyRate, locale)} / hora · ${t('listing.minHours', { hours: p.minimumHours })}`;
    }
    if (p.model === 'quote') {
      return p.startingFrom
        ? t('listing.startingFrom', { price: formatMoney(p.startingFrom, locale) })
        : t('listing.pricingModels.quote');
    }
    return '';
  };

  const formattedDistance = listing.distanceKm !== undefined ? formatDistance(listing.distanceKm, locale) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(listing.id)}
      style={styles.cardContainer}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${renderPrice()}, ${listing.cityName}`}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: listing.coverImage }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        {listing.status.kind !== 'published' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {listing.status.kind === 'paused'
                ? t('listing.paused')
                : listing.status.kind === 'under_review'
                ? t('listing.underReview')
                : t('listing.removed')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.category}>{listing.categoryName.toUpperCase()}</Text>
          {formattedDistance && <Text style={styles.distance}>{formattedDistance}</Text>}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>

        <Text style={styles.price}>{renderPrice()}</Text>

        <View style={styles.footerRow}>
          <Text style={styles.rating}>
            ★ {listing.ratingAverage.toFixed(1)} ({listing.ratingCount})
          </Text>
          <Text style={styles.city}>{listing.cityName}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

ListingCard.displayName = 'ListingCard';

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    height: 180,
    width: '100%',
    backgroundColor: '#f3f4f6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5',
    letterSpacing: 0.5,
  },
  distance: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  rating: {
    fontSize: 13,
    color: '#d97706',
    fontWeight: '600',
  },
  city: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
