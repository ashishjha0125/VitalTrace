import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Theme } from '../theme/theme';

const FilterCard = ({ name, description, enabled, onToggle, children }) => {
  return (
    <View style={[styles.card, !enabled && styles.cardDisabled]}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: Theme.colors.surfaceHigh, true: Theme.colors.primaryDim }}
          thumbColor={enabled ? Theme.colors.primary : Theme.colors.textMuted}
          ios_backgroundColor={Theme.colors.surfaceHigh}
        />
      </View>
      {enabled && children && (
        <View style={styles.controls}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surfaceLow,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm + 4,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  controls: {
    marginTop: Theme.spacing.sm + 4,
    paddingTop: Theme.spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42, 51, 85, 0.3)',
  },
});

export default FilterCard;
