import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { mockDb } from '../../../src/infrastructure/mock/mockService';
import { Booking } from '../../../src/domain/booking';

export default function BookingsScreen() {
  const router = useRouter();
  const bookings = mockDb.getBookings();

  const renderItem = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.listingTitle}</Text>
      <Text style={styles.info}>Proveedor: {item.providerName}</Text>
      <Text style={styles.info}>Fecha: {new Date(item.scheduledFor).toLocaleDateString()}</Text>

      <View style={styles.statusRow}>
        <Text style={styles.statusBadge}>
          Estado: {item.status.kind.toUpperCase()}
        </Text>

        {item.status.kind === 'completed' && (
          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={() => router.push(`/(app)/bookings/${item.id}/review`)}
          >
            <Text style={styles.reviewBtnText}>Reseñar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  info: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  reviewBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reviewBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
