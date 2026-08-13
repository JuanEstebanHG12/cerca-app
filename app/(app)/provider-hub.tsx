import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../src/presentation/context/AuthContext';
import { useMyListingsQuery } from '../../src/presentation/hooks/useListingQueries';
import { Listing } from '../../src/domain/listing';
import { useRouter } from 'expo-router';

export default function ProviderHubScreen() {
  const { actor } = useAuth();
  const router = useRouter();
  const myListingsQuery = useMyListingsQuery();

  const renderItem = ({ item }: { item: Listing }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.category}>{item.categoryName}</Text>
      <Text style={styles.status}>Estado: {item.status.kind.toUpperCase()}</Text>
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => router.push(`/(app)/listings/${item.id}`)}
      >
        <Text style={styles.editBtnText}>Ver / Editar Anuncio</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Anuncios de Proveedor</Text>
        <Text style={styles.headerSub}>Publica y administra tus servicios locales</Text>
        <TouchableOpacity
          style={styles.publishBtn}
          onPress={() => router.push('/(provider)/listings/new')}
        >
          <Text style={styles.publishBtnText}>+ Publicar Anuncio (4 pasos)</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={myListingsQuery.data || []}
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
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  headerSub: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 16,
  },
  publishBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  publishBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
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
  },
  category: {
    fontSize: 13,
    color: '#4f46e5',
    marginVertical: 4,
  },
  status: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 10,
  },
  editBtn: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
});
