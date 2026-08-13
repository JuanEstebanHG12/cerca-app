import React from 'react';
import { View, StyleSheet } from 'react-native';

export const ListingSkeleton: React.FC = () => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.content}>
        <View style={[styles.line, { width: '30%', height: 12 }]} />
        <View style={[styles.line, { width: '80%', height: 18, marginTop: 10 }]} />
        <View style={[styles.line, { width: '50%', height: 22, marginTop: 12 }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  imagePlaceholder: {
    height: 180,
    backgroundColor: '#e5e7eb',
  },
  content: {
    padding: 16,
  },
  line: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
});
