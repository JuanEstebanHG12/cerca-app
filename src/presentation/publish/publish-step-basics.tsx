import { Control, Controller, FieldErrors } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { Chip } from '../components/chip';
import { TextField } from '../components/text-field';
import { colors } from '../theme/colors';
import { useCategories } from '../listings/use-categories';
import { PublishFormValues } from './publish-form-schema';

interface PublishStepBasicsProps {
  control: Control<PublishFormValues>;
  errors: FieldErrors<PublishFormValues>;
}

// Step 1 of 3: what the service is. Category is a required chip pick (there's no sensible
// default), title/description are the same TextField every other screen in the app uses.
export function PublishStepBasics({ control, errors }: PublishStepBasicsProps) {
  const categories = useCategories();

  return (
    <View style={styles.step}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.6}>
          Categoría
        </Text>
        <Controller
          control={control}
          name="categoryId"
          render={({ field: { value, onChange } }) => (
            <View style={styles.chipRow}>
              {categories.data?.map((category) => (
                <Chip key={category.id} label={category.name} selected={value === category.id} onPress={() => onChange(category.id)} />
              ))}
            </View>
          )}
        />
        {errors.categoryId ? (
          <Text style={styles.error} maxFontSizeMultiplier={1.8}>
            {errors.categoryId.message}
          </Text>
        ) : null}
      </View>

      <Controller
        control={control}
        name="title"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={styles.field}>
            <TextField
              label="Título"
              placeholder="Plomería a domicilio"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              maxLength={120}
            />
            {errors.title ? (
              <Text style={styles.error} maxFontSizeMultiplier={1.8}>
                {errors.title.message}
              </Text>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={styles.field}>
            <TextField
              label="Descripción"
              placeholder="Cuéntale a la gente qué ofreces, tu experiencia, y qué incluye."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={5}
              style={styles.multiline}
              maxLength={4000}
            />
            {errors.description ? (
              <Text style={styles.error} maxFontSizeMultiplier={1.8}>
                {errors.description.message}
              </Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  step: { gap: 20 },
  section: { gap: 10 },
  field: { gap: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.inkMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  multiline: { minHeight: 110, textAlignVertical: 'top', paddingTop: 12 },
  error: { fontSize: 13, color: colors.danger },
});
