import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../../src/presentation/context/AuthContext';
import { canReviewBooking } from '../../../../src/domain/review.policy';
import { mockDb } from '../../../../src/infrastructure/mock/mockService';
import { useTranslation } from 'react-i18next';

export default function ReviewBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { actor } = useAuth();
  const { t } = useTranslation();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const booking = mockDb.getBookings().find((b) => b.id === id);

  if (!booking || !actor) {
    return (
      <View style={styles.center}>
        <Text>Reserva no encontrada</Text>
      </View>
    );
  }

  const eligibility = canReviewBooking(actor, booking, new Date());

  const handleSubmit = async () => {
    if (!eligibility.ok) return;
    setIsSubmitting(true);
    mockDb.attachReviewToBooking(booking.id, `rev-${Date.now()}`);
    setIsSubmitting(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('review.title')}</Text>
      <Text style={styles.listingTitle}>{booking.listingTitle}</Text>

      {!eligibility.ok ? (
        <View style={styles.blockedBanner}>
          <Text style={styles.blockedTitle}>⚠️ No es posible reseñar</Text>
          <Text style={styles.blockedReason}>
            {t(`review.blocked.${eligibility.reason}` as any)}
          </Text>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>{t('review.rating')}: {rating} ★</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text style={[styles.star, star <= rating && styles.starActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t('review.comment')}</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
            placeholder="Escribe tu opinión sobre el servicio recibido..."
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, !eligibility.ok && styles.disabledButton]}
        disabled={!eligibility.ok || isSubmitting}
        onPress={handleSubmit}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitButtonText}>{t('review.submit')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  listingTitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 20,
  },
  blockedBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  blockedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 4,
  },
  blockedReason: {
    fontSize: 14,
    color: '#b91c1c',
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  star: {
    fontSize: 32,
    color: '#d1d5db',
  },
  starActive: {
    color: '#f59e0b',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
