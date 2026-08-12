import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/presentation/auth/auth-context';
import { Button } from '../../../src/presentation/components/button';
import { EmptyState } from '../../../src/presentation/listings/empty-state';
import { formatPricingLabel, formatRatingSummary, statusBadgeLabel } from '../../../src/presentation/listings/format-listing';
import { useCategories } from '../../../src/presentation/listings/use-categories';
import { useListing } from '../../../src/presentation/listings/use-listing';
import { colors } from '../../../src/presentation/theme/colors';

// US-04's whole acceptance criterion lives in one line below: `isOwner`. No capacity check
// alongside it — a listing's ownerId only ever belongs to someone who was a provider the moment
// they created it (there's no "stop being a provider" action to make that stale), so ownership
// alone is the layer that matters here (Cerca.md's layer 2, "propiedad"). This button hides
// entirely rather than disabling-with-explanation because it's not *your* business why someone
// else's listing isn't yours to edit — Cerca.md's rule for capacity, applied to a resource: "no
// le interesa y no lo va a conseguir."
export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { actor } = useAuth();
  const listing = useListing(id);
  const categories = useCategories();

  if (listing.status === 'pending') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (listing.status === 'error') {
    const notFound = listing.error.message === 'not_found';
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState
          title={notFound ? 'No encontramos este anuncio' : 'No pudimos cargar el anuncio'}
          message={notFound ? 'Puede que lo hayan retirado.' : 'Revisa tu conexión e inténtalo de nuevo.'}
          primaryAction={notFound ? { label: 'Volver', onPress: () => router.back() } : { label: 'Reintentar', onPress: () => listing.refetch() }}
        />
      </SafeAreaView>
    );
  }

  const data = listing.data;
  const price = formatPricingLabel(data.pricing);
  const badge = statusBadgeLabel(data.status);
  const ratingSummary = formatRatingSummary(data.ratingAvg, data.ratingCount);
  const categoryName = categories.data?.find((category) => category.id === data.categoryId)?.name;
  const isOwner = actor?.id === data.ownerId;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {categoryName ? (
          <Text style={styles.category} maxFontSizeMultiplier={1.6}>
            {categoryName}
          </Text>
        ) : null}

        <View style={styles.titleRow}>
          <Text style={styles.title} maxFontSizeMultiplier={1.6}>
            {data.title}
          </Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText} maxFontSizeMultiplier={1.6}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.priceRow} maxFontSizeMultiplier={1.8}>
          <Text style={styles.priceAmount}>{price.amount}</Text>
          {price.context ? <Text style={styles.priceContext}> {price.context}</Text> : null}
        </Text>

        <Text style={styles.rating} maxFontSizeMultiplier={1.8}>
          {ratingSummary}
        </Text>

        <Text style={styles.description} maxFontSizeMultiplier={1.8}>
          {data.description}
        </Text>
      </ScrollView>

      {isOwner ? (
        <View style={styles.footer}>
          <Button label="Editar" onPress={() => router.push(`/listings/${data.id}/edit`)} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 12 },
  category: { fontSize: 13, fontWeight: '600', color: colors.inkMuted },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 22, fontWeight: '700', color: colors.ink },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: colors.warning },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.warningInk },
  priceRow: { fontSize: 18 },
  priceAmount: { fontWeight: '700', color: colors.accent },
  priceContext: { fontSize: 14, fontWeight: '400', color: colors.inkMuted },
  rating: { fontSize: 14, color: colors.inkMuted },
  description: { fontSize: 15, color: colors.ink, lineHeight: 22, marginTop: 8 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.surfaceBorder },
});
