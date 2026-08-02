import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { 
  Heart, AlertTriangle, Timer, Ruler, Activity, CheckCircle, 
  Zap, Battery, PauseCircle, Stethoscope, HelpCircle, Mountain,
  Gauge, TrendingDown
} from 'lucide-react-native';
import { Theme } from '../theme/theme';

// Map emoji/name to lucide icon component
const iconMap = {
  '❤️': Heart,
  '⚡': Zap,
  '🐢': TrendingDown,
  '⚠️': AlertTriangle,
  '⏱️': Timer,
  '📏': Ruler,
  '✅': CheckCircle,
  '〰️': Activity,
  '🔋': Battery,
  '⏸️': PauseCircle,
  '🩺': Stethoscope,
  '❓': HelpCircle,
  '⛰️': Mountain,
  '🧘': Activity,
  '📉': TrendingDown,
  '📊': Gauge,
};

const AnalysisCard = ({ icon, name, status, message, isOverall = false }) => {
  const statusColor =
    status === 'Normal' ? Theme.colors.success :
    status === 'Warning' ? Theme.colors.warning :
    status === 'Critical' ? Theme.colors.error :
    Theme.colors.textSecondary;

  const statusBgColor =
    status === 'Normal' ? Theme.colors.successDim :
    status === 'Warning' ? Theme.colors.warningDim :
    status === 'Critical' ? Theme.colors.errorDim :
    'transparent';

  const IconComp = iconMap[icon] || Activity;

  return (
    <View style={[styles.card, isOverall && styles.overallCard]}>
      <View style={[styles.iconBox, isOverall && styles.overallIconBox]}>
        <IconComp 
          size={isOverall ? 28 : 20} 
          color={statusColor} 
          strokeWidth={2} 
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, isOverall && styles.overallName]}>{name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
        <Text style={[styles.message, isOverall && styles.overallMessage]}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surfaceLow,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm + 4,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  overallCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.04)',
    borderColor: 'rgba(255, 59, 48, 0.15)',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Theme.roundness.sm,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  overallIconBox: {
    width: 56,
    height: 56,
    borderRadius: Theme.roundness.md,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  overallName: {
    fontSize: 13,
    color: Theme.colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Theme.roundness.full,
    gap: 6,
    marginBottom: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  message: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  overallMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AnalysisCard;
