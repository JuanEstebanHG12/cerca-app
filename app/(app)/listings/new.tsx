import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { PublishWizard } from '../../../src/presentation/publish/publish-wizard';
import { colors } from '../../../src/presentation/theme/colors';

export default function PublishListing() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PublishWizard />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
