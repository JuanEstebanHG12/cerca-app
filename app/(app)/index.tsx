import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_RADIUS_KM, RADIUS_OPTIONS_KM, SearchFilters } from '../../src/domain/models/search-filters';
import { ListingSearchResult } from '../../src/domain/models/listing';
import { SignOutButton } from '../../src/presentation/auth/sign-out-button';
import { colors } from '../../src/presentation/theme/colors';
import { EmptyState } from '../../src/presentation/listings/empty-state';
import { FilterDraft, FiltersSheet } from '../../src/presentation/listings/filters-sheet';
import { LISTING_CARD_HEIGHT, ListingCard } from '../../src/presentation/listings/listing-card';
import { ListingListSkeleton } from '../../src/presentation/listings/listing-card-skeleton';
import { useSearchListings } from '../../src/presentation/listings/use-search-listings';
import { useLocation } from '../../src/presentation/location/use-location';

const MAX_RADIUS_KM = RADIUS_OPTIONS_KM[RADIUS_OPTIONS_KM.length - 1];

function nextRadius(current: number): number {
  const wider = RADIUS_OPTIONS_KM.find((option) => option > current);
  return wider ?? MAX_RADIUS_KM;
}

export default function Home() {
  const location = useLocation();
  const [queryInput, setQueryInput] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const hasActiveFilters = committedQuery !== '' || categoryId !== undefined;

  // Debounced so every keystroke doesn't mint a new cache entry — only the value the user
  // pauses on actually reaches the search.
  useEffect(() => {
    const id = setTimeout(() => setCommittedQuery(queryInput.trim()), 400);
    return () => clearTimeout(id);
  }, [queryInput]);

  const filters: SearchFilters | null =
    location.status === 'granted'
      ? {
          coords: location.coords,
          radiusKm,
          query: committedQuery || undefined,
          categoryId,
        }
      : null;

  const search = useSearchListings(filters);
  const items = useMemo(() => search.data?.pages.flatMap((page) => page.items) ?? [], [search.data]);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<ListingSearchResult>) => <ListingCard listing={item} />, []);
  const keyExtractor = useCallback((item: ListingSearchResult) => item.id, []);
  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: LISTING_CARD_HEIGHT, offset: LISTING_CARD_HEIGHT * index, index }),
    [],
  );
  const onEndReached = useCallback(() => {
    if (search.hasNextPage && !search.isFetchingNextPage) {
      search.fetchNextPage();
    }
  }, [search]);

  function clearFilters() {
    setQueryInput('');
    setCommittedQuery('');
    setCategoryId(undefined);
  }

  function widenRadius() {
    setRadiusKm((current) => nextRadius(current));
  }

  function applyFilters(draft: FilterDraft) {
    setQueryInput(draft.query);
    setCommittedQuery(draft.query.trim());
    setCategoryId(draft.categoryId);
    setRadiusKm(draft.radiusKm);
    setFiltersVisible(false);
  }

  // Ordered explicitly, not as parallel ternaries: location 'denied' must win over search
  // 'pending', because a disabled query (no coords yet) stays 'pending' forever and would
  // otherwise show the loading skeleton instead of the "no location" state.
  function renderBody() {
    if (location.status === 'loading') return <ListingListSkeleton />;
    if (location.status === 'denied') {
      return (
        <EmptyState
          title="No pudimos acceder a tu ubicación"
          message="Cerca necesita tu ubicación para mostrarte servicios cercanos."
          primaryAction={{ label: 'Reintentar', onPress: location.retry }}
        />
      );
    }
    if (search.status === 'pending') return <ListingListSkeleton />;
    if (search.status === 'error') {
      return (
        <EmptyState
          title="No pudimos cargar los servicios"
          message="Revisa tu conexión e inténtalo de nuevo."
          primaryAction={{ label: 'Reintentar', onPress: () => search.refetch() }}
        />
      );
    }
    if (items.length === 0 && hasActiveFilters) {
      return (
        <EmptyState
          title="Ningún servicio coincide con estos filtros"
          message="Prueba a limpiarlos o a buscar en un radio más amplio."
          primaryAction={{ label: 'Limpiar filtros', onPress: clearFilters }}
          secondaryAction={
            radiusKm < MAX_RADIUS_KM ? { label: `Ampliar a ${MAX_RADIUS_KM} km`, onPress: widenRadius } : undefined
          }
        />
      );
    }
    if (items.length === 0) {
      return (
        <EmptyState
          title="Todavía no hay servicios en tu zona"
          message="Prueba a ampliar el radio de búsqueda."
          primaryAction={radiusKm < MAX_RADIUS_KM ? { label: 'Ampliar el radio', onPress: widenRadius } : undefined}
        />
      );
    }
    return (
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.listContent}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={search.isRefetching} onRefresh={() => search.refetch()} tintColor={colors.accent} />
        }
        ListFooterComponent={
          search.isFetchingNextPage ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : null
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title} maxFontSizeMultiplier={1.4}>
            Cerca
          </Text>
          <SignOutButton />
        </View>
        <Text style={styles.tagline} maxFontSizeMultiplier={1.8}>
          Servicios cerca de ti
        </Text>
        <View style={styles.searchRow}>
          <TextInput
            placeholder="Buscar un servicio…"
            placeholderTextColor={colors.inkMuted}
            value={queryInput}
            onChangeText={setQueryInput}
            returnKeyType="search"
            accessibilityLabel="Buscar un servicio"
            maxFontSizeMultiplier={1.6}
            style={styles.searchInput}
          />
          <Pressable
            onPress={() => setFiltersVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir filtros"
            style={styles.filterButton}
          >
            <Text style={styles.filterButtonLabel} maxFontSizeMultiplier={1.6}>
              Filtros
            </Text>
          </Pressable>
        </View>
      </View>

      {renderBody()}

      <FiltersSheet
        visible={filtersVisible}
        initial={{ query: queryInput, categoryId, radiusKm }}
        onApply={applyFilters}
        onClose={() => setFiltersVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 4 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink },
  tagline: { fontSize: 14, color: colors.inkMuted, marginBottom: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
  },
  filterButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  filterButtonLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },
  listContent: { paddingHorizontal: 20 },
  footerLoading: { paddingVertical: 20 },
});
