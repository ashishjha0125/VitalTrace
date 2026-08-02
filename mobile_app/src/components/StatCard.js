import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme/theme';

const StatCard = ({ IconComponent, label, value, unit, color }) => {
  const iconColor = color || Theme.colors.primary;

  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        {IconComponent && <IconComponent size={20} color={iconColor} strokeWidth={2} />}
      </View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: color || Theme.colors.text }]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceLow,
    borderRadius: Theme.roundness.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Theme.roundness.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  unit: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
});

export default StatCard;
