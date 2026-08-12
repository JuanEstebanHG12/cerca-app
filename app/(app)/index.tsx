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
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_RADIUS_KM, RADIUS_OPTIONS_KM, SearchFilters } from '../../src/domain/models/search-filters';
import { Coords } from '../../src/domain/models/coords';
import { ListingSearchResult } from '../../src/domain/models/listing';
import { findCity } from '../../src/domain/models/city';
import { SignOutButton } from '../../src/presentation/auth/sign-out-button';
import { CityPicker } from '../../src/presentation/components/city-picker';
import { LinkButton } from '../../src/presentation/components/link-button';
import { colors } from '../../src/presentation/theme/colors';
import { EmptyState } from '../../src/presentation/listings/empty-state';
import { FilterDraft, FiltersSheet } from '../../src/presentation/listings/filters-sheet';
import { LISTING_CARD_HEIGHT, ListingCard } from '../../src/presentation/listings/listing-card';
import { ListingListSkeleton } from '../../src/presentation/listings/listing-card-skeleton';
import { useSearchListings } from '../../src/presentation/listings/use-search-listings';
import { useSearchOrigin } from '../../src/presentation/location/use-search-origin';

const MAX_RADIUS_KM = RADIUS_OPTIONS_KM[RADIUS_OPTIONS_KM.length - 1];

function nextRadius(current: number): number {
  const wider = RADIUS_OPTIONS_KM.find((option) => option > current);
  return wider ?? MAX_RADIUS_KM;
}

export default function Home() {
  const origin = useSearchOrigin();
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

  // US-08: no device coordinates doesn't mean no search — a picked city resolves to its
  // centroid (findCity) and searches from there instead, same SearchFilters shape either way.
  const originCoords: Coords | undefined =
    origin.state.phase === 'coords'
      ? origin.state.coords
      : origin.state.phase === 'city'
        ? findCity(origin.state.cityId)?.coords
        : undefined;

  const filters: SearchFilters | null = originCoords
    ? {
        coords: originCoords,
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

  // Ordered explicitly, not as parallel ternaries: 'needs-city' must win over search
  // 'pending', because a disabled query (no coords yet) stays 'pending' forever and would
  // otherwise show the loading skeleton instead of the city picker.
  function renderBody() {
    if (origin.state.phase === 'loading') return <ListingListSkeleton />;
    if (origin.state.phase === 'needs-city') {
      const { reason } = origin.state;
      return (
        <View style={styles.cityFallback}>
          <Text style={styles.cityFallbackTitle} maxFontSizeMultiplier={1.6}>
            {reason === 'denied' ? 'No compartiste tu ubicación' : 'No pudimos acceder a tu ubicación'}
          </Text>
          <Text style={styles.cityFallbackMessage} maxFontSizeMultiplier={1.8}>
            {reason === 'denied'
              ? 'Elige una ciudad para seguir buscando servicios cerca de ti.'
              : 'Puede que el GPS esté apagado. Elige una ciudad mientras tanto.'}
          </Text>
          <CityPicker onSelect={origin.selectCity} />
          <Pressable onPress={origin.retryLocation} accessibilityRole="button" style={styles.cityFallbackRetry}>
            <Text style={styles.cityFallbackRetryLabel} maxFontSizeMultiplier={1.6}>
              Reintentar con mi ubicación
            </Text>
          </Pressable>
        </View>
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
        {origin.state.phase === 'city' && (
          <Pressable onPress={origin.retryLocation} accessibilityRole="button" style={styles.cityBanner}>
            <Text style={styles.cityBannerText} maxFontSizeMultiplier={1.6}>
              Buscando cerca de {findCity(origin.state.cityId)?.name} ·{' '}
              <Text style={styles.cityBannerAction}>Cambiar</Text>
            </Text>
          </Pressable>
        )}
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

      {/* Quick access to the standalone AC proofs (Cerca.md: "si no lo pueden explicar, no
          lo entregan") — the behaviour itself lives in the real search above, these just make
          it easy to demo US-07/US-08 in isolation without changing the device's language or
          revoking a permission mid-demo. */}
      <View style={styles.qaLinks}>
        <LinkButton prompt="US-07:" actionLabel="precio y distancia por locale" onPress={() => router.push('/locale-preview')} />
        <LinkButton prompt="US-08:" actionLabel="ubicación con degradación elegante" onPress={() => router.push('/location-demo')} />
      </View>

      {renderBody()}

      {/* Entry point for US-03: any signed-in user can tap it, but PublishWizard gates on
          the 'provider' capacity before showing the form itself — the button never
          disappears, since becoming a provider is an in-app action, not a separate account. */}
      <Pressable
        onPress={() => router.push('/listings/new')}
        accessibilityRole="button"
        accessibilityLabel="Publicar un servicio"
        style={styles.fab}
      >
        <Text style={styles.fabLabel} maxFontSizeMultiplier={1.4}>
          +
        </Text>
      </Pressable>

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
  cityBanner: { alignSelf: 'flex-start', minHeight: 24, justifyContent: 'center' },
  cityBannerText: { fontSize: 13, color: colors.inkMuted },
  cityBannerAction: { color: colors.accent, fontWeight: '600' },
  cityFallback: { flex: 1, padding: 20, gap: 16 },
  cityFallbackTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  cityFallbackMessage: { fontSize: 14, color: colors.inkMuted },
  cityFallbackRetry: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  cityFallbackRetryLabel: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  qaLinks: { paddingHorizontal: 20, gap: 2 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  fabLabel: { fontSize: 28, fontWeight: '700', color: colors.accentInk, lineHeight: 32 },
});
