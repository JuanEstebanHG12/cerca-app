import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  useSearchListingsQuery,
  useCategoriesQuery,
} from '../../../src/presentation/hooks/useListingQueries';
import { ListingCard } from '../../../src/presentation/components/ListingCard';
import { ListingSkeleton } from '../../../src/presentation/components/ListingSkeleton';
import { Listing } from '../../../src/domain/listing';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const router = useRouter();
  const { t } = useTranslation();

  const categoriesQuery = useCategoriesQuery();
  const searchParams = {
    query: query || undefined,
    categoryId: selectedCategory,
    lat: 19.4326,
    lng: -99.1332,
    radiusKm,
  };

  const listingsQuery = useSearchListingsQuery(searchParams);

  const handleCardPress = useCallback(
    (id: string) => {
      router.push(`/(app)/listings/${id}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Listing }) => (
      <ListingCard listing={item} onPress={handleCardPress} locale="es-MX" />
    ),
    [handleCardPress]
  );

  const keyExtractor = useCallback((item: Listing) => item.id, []);

  const getItemLayout = useCallback(
    (_data: Array<Listing> | null | undefined, index: number) => ({
      length: 290,
      offset: 290 * index,
      index,
    }),
    []
  );

  const hasFilters = Boolean(query || selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Search Input */}
      <View style={styles.searchHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('search.placeholder')}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Category Pills */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categoriesQuery.data || []}
          keyExtractor={(cat) => cat.id}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.id;
            return (
              <TouchableOpacity
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedCategory(isSelected ? undefined : item.id)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main Content & 4 UI States */}
      {listingsQuery.isLoading && (
        <View style={styles.skeletonList}>
          <ListingSkeleton />
          <ListingSkeleton />
          <ListingSkeleton />
        </View>
      )}

      {listingsQuery.isError && (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>{t('search.states.errorTitle')}</Text>
          <Text style={styles.stateSubtitle}>{t('search.states.errorMessage')}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => listingsQuery.refetch()}>
            <Text style={styles.buttonText}>{t('search.states.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!listingsQuery.isLoading &&
        !listingsQuery.isError &&
        (listingsQuery.data?.items.length ?? 0) === 0 && (
          <View style={styles.centerState}>
            <Text style={styles.stateTitle}>
              {hasFilters ? t('search.states.emptyFiltered') : t('search.states.emptyInitial')}
            </Text>
            <View style={styles.buttonRow}>
              {hasFilters && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setQuery('');
                    setSelectedCategory(undefined);
                  }}
                >
                  <Text style={styles.secondaryButtonText}>{t('search.clearFilters')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setRadiusKm((r) => r + 10)}
              >
                <Text style={styles.buttonText}>{t('search.expandRadius')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      {!listingsQuery.isLoading &&
        !listingsQuery.isError &&
        (listingsQuery.data?.items.length ?? 0) > 0 && (
          <FlatList
            data={listingsQuery.data?.items}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            contentContainerStyle={styles.listContent}
          />
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  categoriesContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#4f46e5',
  },
  chipText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  skeletonList: {
    paddingTop: 8,
  },
  listContent: {
    paddingVertical: 8,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  stateSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#e0e7ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4338ca',
    fontSize: 15,
    fontWeight: '700',
  },
});
