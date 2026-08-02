import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TrendingUp, ArrowUp, ArrowDown, Minus, Heart, Activity } from 'lucide-react-native';
import { Theme } from '../theme/theme';

const TrendsScreen = ({ bpmHistory = [], isConnected }) => {
  // Calculate stats from BPM history
  const validBpms = bpmHistory.filter(b => typeof b === 'number' && b > 0);
  const avgBpm = validBpms.length > 0 
    ? Math.round(validBpms.reduce((a, b) => a + b, 0) / validBpms.length) 
    : '--';
  const maxBpm = validBpms.length > 0 ? Math.max(...validBpms) : '--';
  const minBpm = validBpms.length > 0 ? Math.min(...validBpms) : '--';
  const lastBpm = validBpms.length > 0 ? validBpms[validBpms.length - 1] : '--';

  // Simple trend direction
  let trend = 'stable';
  if (validBpms.length >= 10) {
    const recent = validBpms.slice(-5);
    const earlier = validBpms.slice(-10, -5);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    if (recentAvg > earlierAvg + 3) trend = 'rising';
    else if (recentAvg < earlierAvg - 3) trend = 'falling';
  }

  const trendIcon = trend === 'rising' ? ArrowUp : trend === 'falling' ? ArrowDown : Minus;
  const trendColor = trend === 'rising' ? Theme.colors.warning : trend === 'falling' ? Theme.colors.secondary : Theme.colors.success;

  // Build simple bar chart data (last 20 readings)
  const chartData = validBpms.slice(-20);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Heart Rate Trends</Text>
      <Text style={styles.screenSubtitle}>Real-time monitoring session data</Text>

      {/* Current BPM Banner */}
      <View style={styles.currentCard}>
        <View style={styles.currentLeft}>
          <Heart size={24} color={Theme.colors.primary} fill={isConnected ? Theme.colors.primary : 'transparent'} />
          <View>
            <Text style={styles.currentLabel}>Current</Text>
            <View style={styles.currentValueRow}>
              <Text style={styles.currentValue}>{lastBpm}</Text>
              <Text style={styles.currentUnit}>BPM</Text>
            </View>
          </View>
        </View>
        <View style={[styles.trendBadge, { backgroundColor: `${trendColor}15` }]}>
          {React.createElement(trendIcon, { size: 16, color: trendColor })}
          <Text style={[styles.trendText, { color: trendColor }]}>
            {trend === 'rising' ? 'Rising' : trend === 'falling' ? 'Falling' : 'Stable'}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.miniStat}>
          <Text style={styles.miniLabel}>Average</Text>
          <Text style={styles.miniValue}>{avgBpm}</Text>
          <Text style={styles.miniUnit}>BPM</Text>
        </View>
        <View style={[styles.miniStat, styles.miniStatCenter]}>
          <Text style={styles.miniLabel}>Maximum</Text>
          <Text style={[styles.miniValue, { color: Theme.colors.warning }]}>{maxBpm}</Text>
          <Text style={styles.miniUnit}>BPM</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={styles.miniLabel}>Minimum</Text>
          <Text style={[styles.miniValue, { color: Theme.colors.secondary }]}>{minBpm}</Text>
          <Text style={styles.miniUnit}>BPM</Text>
        </View>
      </View>

      {/* Simple Bar Chart */}
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <TrendingUp size={18} color={Theme.colors.primary} />
          <Text style={styles.chartTitle}>Session Timeline</Text>
          <Text style={styles.chartCount}>{chartData.length} readings</Text>
        </View>

        {chartData.length > 0 ? (
          <View style={styles.chartContainer}>
            <View style={styles.barChart}>
              {chartData.map((bpm, index) => {
                const height = Math.max(8, ((bpm - 40) / 120) * 140);
                const barColor = bpm > 100 ? Theme.colors.warning : bpm < 60 ? Theme.colors.secondary : Theme.colors.primary;
                return (
                  <View key={index} style={styles.barWrapper}>
                    <View style={[styles.bar, { height, backgroundColor: barColor }]} />
                  </View>
                );
              })}
            </View>
            <View style={styles.chartAxis}>
              <Text style={styles.axisLabel}>Older</Text>
              <Text style={styles.axisLabel}>Recent</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Activity size={40} color={Theme.colors.textMuted} />
            <Text style={styles.emptyText}>No BPM data yet</Text>
            <Text style={styles.emptySubtext}>Connect your device to start tracking</Text>
          </View>
        )}
      </View>

      {/* Zone Analysis */}
      <View style={styles.zoneSection}>
        <Text style={styles.zoneTitle}>Heart Rate Zones</Text>
        <View style={styles.zoneRow}>
          <View style={[styles.zoneDot, { backgroundColor: Theme.colors.secondary }]} />
          <Text style={styles.zoneLabel}>Resting (&lt;60 BPM)</Text>
          <Text style={styles.zoneCount}>
            {validBpms.filter(b => b < 60).length}
          </Text>
        </View>
        <View style={styles.zoneRow}>
          <View style={[styles.zoneDot, { backgroundColor: Theme.colors.success }]} />
          <Text style={styles.zoneLabel}>Normal (60-100 BPM)</Text>
          <Text style={styles.zoneCount}>
            {validBpms.filter(b => b >= 60 && b <= 100).length}
          </Text>
        </View>
        <View style={styles.zoneRow}>
          <View style={[styles.zoneDot, { backgroundColor: Theme.colors.warning }]} />
          <Text style={styles.zoneLabel}>Elevated (100-120 BPM)</Text>
          <Text style={styles.zoneCount}>
            {validBpms.filter(b => b > 100 && b <= 120).length}
          </Text>
        </View>
        <View style={styles.zoneRow}>
          <View style={[styles.zoneDot, { backgroundColor: Theme.colors.error }]} />
          <Text style={styles.zoneLabel}>High (&gt;120 BPM)</Text>
          <Text style={styles.zoneCount}>
            {validBpms.filter(b => b > 120).length}
          </Text>
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.lg,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.xl,
  },
  currentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceLow,
    borderRadius: Theme.roundness.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  currentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  currentLabel: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  currentValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  currentValue: {
    fontSize: 36,
    fontWeight: '900',
    color: Theme.colors.text,
  },
  currentUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.roundness.full,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.surfaceLow,
    borderRadius: Theme.roundness.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  miniStatCenter: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: Theme.colors.outline,
    borderRightColor: Theme.colors.outline,
  },
  miniLabel: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  miniValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.text,
  },
  miniUnit: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  chartSection: {
    backgroundColor: Theme.colors.surfaceLow,
    borderRadius: Theme.roundness.xl,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Theme.spacing.md,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.text,
    flex: 1,
  },
  chartCount: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  chartContainer: {},
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    gap: 3,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '80%',
    borderRadius: 3,
    minWidth: 4,
  },
  chartAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  axisLabel: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  emptyChart: {
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    marginTop: 4,
  },
  zoneSection: {
    backgroundColor: Theme.colors.surfaceLow,
    borderRadius: Theme.roundness.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  zoneTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 51, 85, 0.3)',
  },
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  zoneLabel: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  zoneCount: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
  },
});

export default TrendsScreen;
