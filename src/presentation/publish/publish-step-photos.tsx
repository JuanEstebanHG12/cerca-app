import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Control, useFieldArray } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/button';
import { colors } from '../theme/colors';
import { PublishFormValues } from './publish-form-schema';

const MAX_PHOTOS = 6;

interface PublishStepPhotosProps {
  control: Control<PublishFormValues>;
}

// Step 4 of 4: photo selection only. Nothing here talks to the network — `photos` just holds
// local device URIs until submit, where `useCreateListing` uploads them through `PhotoGateway`
// once the listing (and its id) actually exists. That upload is best-effort and can fail today
// (the backend route isn't live — see photo-errors.ts); this screen doesn't need to know that,
// it only has to let the user build the list and see it survive a draft resume.
export function PublishStepPhotos({ control }: PublishStepPhotosProps) {
  // `keyName: 'fieldId'` (default is 'id') keeps RHF's own React-key field from overwriting
  // `LocalPhoto.id` — the id this component sets from the picker (`asset.assetId ?? asset.uri`)
  // is domain data, not just a rendering key.
  const { fields, append, remove } = useFieldArray({ control, name: 'photos', keyName: 'fieldId' });
  const [permissionDenied, setPermissionDenied] = useState(false);

  async function pickPhotos() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPermissionDenied(true);
      return;
    }
    setPermissionDenied(false);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: Math.max(MAX_PHOTOS - fields.length, 1),
    });
    if (result.canceled) return;

    for (const asset of result.assets.slice(0, MAX_PHOTOS - fields.length)) {
      append({ id: asset.assetId ?? asset.uri, uri: asset.uri });
    }
  }

  const canAddMore = fields.length < MAX_PHOTOS;

  return (
    <View style={styles.step}>
      <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.6}>
        Fotos del servicio
      </Text>
      <Text style={styles.hint} maxFontSizeMultiplier={1.8}>
        Opcional, hasta {MAX_PHOTOS} fotos. Un anuncio con fotos genera más confianza.
      </Text>

      {fields.length > 0 ? (
        <View style={styles.grid}>
          {fields.map((field, index) => (
            <View key={field.fieldId} style={styles.thumbWrapper}>
              <Image source={{ uri: field.uri }} style={styles.thumb} contentFit="cover" cachePolicy="memory-disk" />
              <Pressable
                onPress={() => remove(index)}
                accessibilityRole="button"
                accessibilityLabel={`Quitar foto ${index + 1}`}
                style={styles.removeButton}
                hitSlop={8}
              >
                <Text style={styles.removeButtonLabel} maxFontSizeMultiplier={1.2}>
                  ×
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {permissionDenied ? (
        <Text style={styles.error} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.8}>
          Necesitamos acceso a tus fotos para agregarlas al anuncio. Habilítalo en Ajustes.
        </Text>
      ) : null}

      {canAddMore ? (
        <Button label={fields.length === 0 ? 'Agregar fotos' : 'Agregar más fotos'} variant="secondary" onPress={pickPhotos} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  step: { gap: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.inkMuted },
  hint: { fontSize: 14, color: colors.inkMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  thumbWrapper: { width: 88, height: 88 },
  thumb: { width: 88, height: 88, borderRadius: 10, backgroundColor: colors.surface },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  removeButtonLabel: { fontSize: 16, fontWeight: '700', color: colors.ink, lineHeight: 18 },
  error: { fontSize: 13, color: colors.danger },
});
