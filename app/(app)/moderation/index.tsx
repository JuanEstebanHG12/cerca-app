import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Report } from '../../../src/domain/models/report';
import { EmptyState } from '../../../src/presentation/listings/empty-state';
import { ModerationQueueRow } from '../../../src/presentation/moderation/moderation-queue-row';
import { useReportQueue } from '../../../src/presentation/moderation/use-report-queue';
import { colors } from '../../../src/presentation/theme/colors';

// Reachable by anyone who navigates here directly — this screen doesn't redirect a non-moderator
// away. That's on purpose (Cerca.md: hiding a button is UX, not security): the entry point on
// Home only shows for canModerate(actor), and if someone bypasses that, GET /reports itself
// returns 403 'no_capacity' (PolicyGuard, verified live — see US-09-MODERATION-QUEUE.md §5), so
// this screen just shows the same EmptyState it would show for any other error.
export default function ModerationQueue() {
  const queue = useReportQueue();
  const items = useMemo(() => queue.data?.pages.flatMap((page) => page.items) ?? [], [queue.data]);

  const onEndReached = useCallback(() => {
    if (queue.hasNextPage && !queue.isFetchingNextPage) {
      queue.fetchNextPage();
    }
  }, [queue]);

  function renderBody() {
    if (queue.status === 'pending') {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      );
    }
    if (queue.status === 'error') {
      const noCapacity = queue.error instanceof Error && queue.error.message === 'no_capacity';
      return (
        <EmptyState
          title={noCapacity ? 'No tienes permiso para moderar' : 'No pudimos cargar la cola'}
          message={noCapacity ? 'Esta sección es solo para moderadores.' : 'Revisa tu conexión e inténtalo de nuevo.'}
          primaryAction={noCapacity ? undefined : { label: 'Reintentar', onPress: () => queue.refetch() }}
        />
      );
    }
    if (items.length === 0) {
      return <EmptyState title="No hay reportes abiertos" message="Cuando alguien denuncie un anuncio, va a aparecer aquí." />;
    }
    return (
      <FlatList
        data={items}
        keyExtractor={(item: Report) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <ModerationQueueRow report={item} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          queue.isFetchingNextPage ? (
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
      <Text style={styles.title} maxFontSizeMultiplier={1.6}>
        Cola de moderación
      </Text>
      {renderBody()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink, padding: 20, paddingBottom: 8 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 20 },
  footerLoading: { paddingVertical: 20 },
});
