import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiListingGateway } from '../../../src/infrastructure/api/ApiListingGateway';
import { Pricing } from '../../../src/domain/listing';
import { useCategoriesQuery } from '../../../src/presentation/hooks/useListingQueries';
import { useQueryClient } from '@tanstack/react-query';
import { listingKeys } from '../../../src/presentation/hooks/useListingQueries';

const gateway = new ApiListingGateway();

type Step = 1 | 2 | 3 | 4;

export default function NewListingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const categoriesQuery = useCategoriesQuery();

  // Step 1 — Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Step 2 — Pricing
  const [pricingModel, setPricingModel] = useState<'fixed' | 'hourly' | 'quote'>('fixed');
  const [priceAmount, setPriceAmount] = useState('');
  const [minHours, setMinHours] = useState('2');

  // Step 3 — Location
  const [cityName, setCityName] = useState('Ciudad de México');
  const [serviceRadius, setServiceRadius] = useState('10');

  // Step 4 — Confirmation
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentStep, setCurrentStep] = useState<Step>(1);

  const buildPricing = (): Pricing => {
    const amountMinor = Math.round(parseFloat(priceAmount || '0') * 100);
    if (pricingModel === 'fixed') {
      return { model: 'fixed', price: { amountMinor, currency: 'MXN' } };
    }
    if (pricingModel === 'hourly') {
      return {
        model: 'hourly',
        hourlyRate: { amountMinor, currency: 'MXN' },
        minimumHours: parseInt(minHours, 10) || 1,
      };
    }
    return {
      model: 'quote',
      startingFrom: amountMinor > 0 ? { amountMinor, currency: 'MXN' } : undefined,
    };
  };

  const handleNext = () => {
    if (currentStep === 1 && (!title.trim() || !selectedCategoryId)) {
      Alert.alert('Campos requeridos', 'Por favor completa el título y selecciona una categoría.');
      return;
    }
    if (currentStep < 4) setCurrentStep(((currentStep + 1) as Step));
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(((currentStep - 1) as Step));
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      await gateway.createListing({
        title: title.trim(),
        description: description.trim(),
        categoryId: selectedCategoryId,
        pricing: buildPricing(),
        location: { lat: 19.4326, lng: -99.1332 },
        cityName,
        serviceRadiusKm: parseFloat(serviceRadius) || 10,
        photos: [],
      });
      qc.invalidateQueries({ queryKey: listingKeys.mine() });
      qc.invalidateQueries({ queryKey: listingKeys.searches() });
      Alert.alert('¡Anuncio publicado!', 'Tu servicio ya está disponible en la plataforma.', [
        { text: 'Ver Mis Anuncios', onPress: () => router.replace('/(app)/provider-hub') },
      ]);
    } catch (e) {
      Alert.alert('Error', 'No se pudo publicar el anuncio. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles: Record<Step, string> = {
    1: t('listing.step1'),
    2: t('listing.step2'),
    3: t('listing.step3'),
    4: t('listing.step4'),
  };

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.stepsRow}>
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <View key={s} style={[styles.stepDot, s <= currentStep && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, s <= currentStep && styles.stepDotTextActive]}>
                {s}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.stepTitle}>{stepTitles[currentStep]}</Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Step 1: Basic Info ── */}
        {currentStep === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.fieldLabel}>Título del servicio *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Reparación de Fontanería Urgente"
            />

            <Text style={styles.fieldLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholder="Describe tu servicio, experiencia y qué incluye..."
            />

            <Text style={styles.fieldLabel}>Categoría *</Text>
            <View style={styles.categoryGrid}>
              {(categoriesQuery.data || []).map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Step 2: Pricing Model ── */}
        {currentStep === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.fieldLabel}>Modelo de precio</Text>

            {(['fixed', 'hourly', 'quote'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modelCard, pricingModel === m && styles.modelCardSelected]}
                onPress={() => setPricingModel(m)}
              >
                <Text style={[styles.modelTitle, pricingModel === m && styles.modelTitleSelected]}>
                  {m === 'fixed' ? `💰 ${t('listing.pricingModels.fixed')}` :
                   m === 'hourly' ? `⏱ ${t('listing.pricingModels.hourly')}` :
                   `📋 ${t('listing.pricingModels.quote')}`}
                </Text>
                <Text style={styles.modelDesc}>
                  {m === 'fixed' ? 'Un precio único y claro para el servicio.' :
                   m === 'hourly' ? 'Precio por hora con horas mínimas requeridas.' :
                   'El precio se acuerda tras analizar los detalles.'}
                </Text>
              </TouchableOpacity>
            ))}

            {pricingModel !== 'quote' && (
              <>
                <Text style={styles.fieldLabel}>
                  {pricingModel === 'fixed' ? 'Precio (MXN)' : 'Precio por hora (MXN)'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={priceAmount}
                  onChangeText={setPriceAmount}
                  keyboardType="numeric"
                  placeholder="Ej: 450"
                />
              </>
            )}

            {pricingModel === 'quote' && (
              <>
                <Text style={styles.fieldLabel}>Precio estimado desde (opcional, MXN)</Text>
                <TextInput
                  style={styles.input}
                  value={priceAmount}
                  onChangeText={setPriceAmount}
                  keyboardType="numeric"
                  placeholder="Ej: 500 (opcional)"
                />
              </>
            )}

            {pricingModel === 'hourly' && (
              <>
                <Text style={styles.fieldLabel}>Horas mínimas requeridas</Text>
                <TextInput
                  style={styles.input}
                  value={minHours}
                  onChangeText={setMinHours}
                  keyboardType="numeric"
                  placeholder="Ej: 2"
                />
              </>
            )}
          </View>
        )}

        {/* ── Step 3: Location ── */}
        {currentStep === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.fieldLabel}>Ciudad</Text>
            <TextInput
              style={styles.input}
              value={cityName}
              onChangeText={setCityName}
              placeholder="Ej: Ciudad de México"
            />

            <Text style={styles.fieldLabel}>Radio de cobertura (km)</Text>
            <TextInput
              style={styles.input}
              value={serviceRadius}
              onChangeText={setServiceRadius}
              keyboardType="numeric"
              placeholder="Ej: 10"
            />

            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                📍 El radio de cobertura indica qué tan lejos puedes prestar el servicio desde tu ubicación.
              </Text>
            </View>
          </View>
        )}

        {/* ── Step 4: Confirmation ── */}
        {currentStep === 4 && (
          <View style={styles.stepContent}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumen del anuncio</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Título</Text>
                <Text style={styles.summaryValue}>{title || '—'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Categoría</Text>
                <Text style={styles.summaryValue}>
                  {categoriesQuery.data?.find((c) => c.id === selectedCategoryId)?.name || '—'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Precio</Text>
                <Text style={styles.summaryValue}>
                  {pricingModel === 'fixed' ? `$${priceAmount} MXN fijo` :
                   pricingModel === 'hourly' ? `$${priceAmount}/hora · mín. ${minHours}h` :
                   priceAmount ? `Desde $${priceAmount} MXN` : 'Bajo presupuesto'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ciudad</Text>
                <Text style={styles.summaryValue}>{cityName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Cobertura</Text>
                <Text style={styles.summaryValue}>{serviceRadius} km</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navButtons}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>← Atrás</Text>
          </TouchableOpacity>
        )}

        {currentStep < 4 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>Siguiente →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, styles.publishBtn, isSubmitting && styles.disabledBtn]}
            onPress={handlePublish}
            disabled={isSubmitting}
          >
            <Text style={styles.nextBtnText}>
              {isSubmitting ? 'Publicando...' : '🚀 Publicar Anuncio'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },

  progressHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  stepsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  stepDotActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  stepDotText: { fontSize: 14, fontWeight: '700', color: '#9ca3af' },
  stepDotTextActive: { color: '#ffffff' },
  stepTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },

  scrollContent: { flex: 1 },
  stepContent: { padding: 20 },

  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    backgroundColor: '#f9fafb',
  },
  textArea: { height: 100, textAlignVertical: 'top' },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  categoryChipSelected: { backgroundColor: '#eff6ff', borderColor: '#4f46e5' },
  categoryChipText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  categoryChipTextSelected: { color: '#4338ca' },

  modelCard: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    backgroundColor: '#f9fafb',
  },
  modelCardSelected: { borderColor: '#4f46e5', backgroundColor: '#eff6ff' },
  modelTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 4 },
  modelTitleSelected: { color: '#4338ca' },
  modelDesc: { fontSize: 13, color: '#6b7280' },

  infoBanner: {
    marginTop: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  infoBannerText: { fontSize: 13, color: '#92400e', lineHeight: 20 },

  summaryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  summaryValue: { fontSize: 14, color: '#111827', fontWeight: '700', flexShrink: 1, textAlign: 'right' },

  navButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  backBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  backBtnText: { color: '#374151', fontSize: 15, fontWeight: '700' },
  nextBtn: {
    flex: 2,
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  publishBtn: { backgroundColor: '#059669' },
  disabledBtn: { backgroundColor: '#9ca3af' },
  nextBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
