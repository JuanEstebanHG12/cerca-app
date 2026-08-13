import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useListingDetailQuery, useFavoriteMutation } from '../../../src/presentation/hooks/useListingQueries';
import { useAuth } from '../../../src/presentation/context/AuthContext';
import { canEditListing } from '../../../src/domain/listing';
import { formatMoney } from '../../../src/domain/money';
import { useTranslation } from 'react-i18next';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { actor } = useAuth();

  const detailQuery = useListingDetailQuery(id || '');
  const favoriteMutation = useFavoriteMutation();

  if (detailQuery.isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const listing = detailQuery.data;
  if (!listing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Anuncio no encontrado</Text>
      </View>
    );
  }

  const isOwnerOrAdmin = actor ? canEditListing(actor, listing) : false;

  const renderPrice = () => {
    const p = listing.pricing;
    if (p.model === 'fixed') return formatMoney(p.price, 'es-MX');
    if (p.model === 'hourly') {
      return `${formatMoney(p.hourlyRate, 'es-MX')} / hora · Mín. ${p.minimumHours} hrs`;
    }
    if (p.model === 'quote') {
      return p.startingFrom
        ? `Desde ${formatMoney(p.startingFrom, 'es-MX')}`
        : 'Bajo presupuesto';
    }
    return '';
  };

  const handleToggleFavorite = () => {
    favoriteMutation.mutate({ id: listing.id, next: !listing.isFavorite });
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: listing.coverImage }} style={styles.image} contentFit="cover" />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.category}>{listing.categoryName.toUpperCase()}</Text>
          <TouchableOpacity style={styles.favButton} onPress={handleToggleFavorite}>
            <Text style={styles.favText}>{listing.isFavorite ? '❤️ Guardado' : '🤍 Guardar'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.price}>{renderPrice()}</Text>

        <View style={styles.ownerCard}>
          <View style={styles.ownerAvatar}>
            <Text style={styles.avatarText}>{listing.ownerName[0]}</Text>
          </View>
          <View>
            <Text style={styles.ownerName}>{listing.ownerName}</Text>
            <Text style={styles.rating}>★ {listing.ratingAverage.toFixed(1)} ({listing.ratingCount} reseñas)</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Descripción del servicio</Text>
        <Text style={styles.description}>{listing.description}</Text>

        <View style={styles.actionsContainer}>
          {isOwnerOrAdmin && (
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{t('listing.editListing')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{t('listing.requestBooking')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  image: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4f46e5',
  },
  favButton: {
    padding: 6,
  },
  favText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 16,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  ownerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  ownerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  rating: {
    fontSize: 13,
    color: '#d97706',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 24,
  },
  actionsContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '700',
  },
});
