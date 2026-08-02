import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Bluetooth, Wifi, WifiOff, Zap, Activity, Battery, ActivitySquare, ShieldCheck, Gauge } from 'lucide-react-native';
import HeartRateCircle from '../components/HeartRateCircle';
import ECGGraph from '../components/ECGGraph';
import StatCard from '../components/StatCard';
import { Theme } from '../theme/theme';

const HomeScreen = ({
  isConnected,
  status,
  bpm,
  leadsOff,
  sampleRate,
  totalSamples,
  filteredData,
  rawData,
  showRaw,
  onToggleConnection,
  signalQuality,
}) => {

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statusBarSpacer} />
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <Text style={styles.monitoringLabel}>
            {isConnected ? 'MONITORING' : 'STANDBY'}
          </Text>
          <Text style={[styles.monitoringStatus, { color: isConnected ? Theme.colors.primary : Theme.colors.textMuted }]}>
            {isConnected ? 'ACTIVE' : 'INACTIVE'}
          </Text>
          <Text style={styles.patientLabel}>Device: VitalTrace ECG</Text>
        </View>
        <TouchableOpacity 
          style={[styles.connectButton, isConnected && styles.connectButtonActive]}
          onPress={onToggleConnection}
          activeOpacity={0.7}
        >
          <Bluetooth 
            size={22} 
            color={isConnected ? Theme.colors.primary : Theme.colors.textSecondary}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {/* Connection Status Badge */}
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, isConnected ? styles.statusConnected : styles.statusDisconnected]}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? Theme.colors.primary : Theme.colors.error }]} />
          {isConnected ? (
            <Wifi size={14} color={Theme.colors.primary} />
          ) : (
            <WifiOff size={14} color={Theme.colors.error} />
          )}
          <Text style={[styles.statusText, { color: isConnected ? Theme.colors.primary : Theme.colors.error }]}>
            {status}
          </Text>
        </View>
        {leadsOff && (
          <View style={styles.leadsOffBadge}>
            <Zap size={14} color={Theme.colors.error} />
            <Text style={styles.leadsOffText}>LEADS OFF</Text>
          </View>
        )}
      </View>

      {/* Heart Rate Circle */}
      <HeartRateCircle 
        bpm={isConnected ? bpm : '--'} 
        isConnected={isConnected}
        isLeadsOff={leadsOff}
      />

      {/* Device Info Badges */}
      <View style={styles.badgeRow}>
        <View style={styles.infoBadge}>
          <Activity size={14} color={Theme.colors.primary} />
          <Text style={styles.infoBadgeText}>
            {isConnected ? 'Active Monitoring' : 'Standby'}
          </Text>
        </View>
        <View style={[styles.infoBadge, { backgroundColor: Theme.colors.surfaceHigh }]}>
          <Battery size={14} color={Theme.colors.textSecondary} />
          <Text style={styles.infoBadgeText}>BLE</Text>
        </View>
      </View>

      {/* ECG Live Stream */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ECG Live Stream (II)</Text>
          <View style={[styles.liveBadge, isConnected && styles.liveBadgeActive]}>
            <View style={[styles.liveDot, isConnected && styles.liveDotActive]} />
            <Text style={[styles.liveText, isConnected && styles.liveTextActive]}>
              {showRaw ? 'RAW' : 'FILTERED'}
            </Text>
          </View>
        </View>
        <ECGGraph 
          data={filteredData} 
          rawData={rawData}
          showRaw={showRaw}
        />
        <View style={styles.graphFooter}>
          <Text style={styles.graphLabel}>Lead II • 25mm/s • Auto-Scale</Text>
        </View>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          IconComponent={Gauge}
          label="Samples/s"
          value={sampleRate}
          unit="Hz"
          color={Theme.colors.secondary}
        />
        <StatCard
          IconComponent={ActivitySquare}
          label="Total"
          value={totalSamples > 999 ? `${(totalSamples / 1000).toFixed(1)}K` : totalSamples}
          unit="samples"
        />
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          IconComponent={ShieldCheck}
          label="System"
          value={signalQuality}
          color={signalQuality === 'Optimal' ? Theme.colors.success : Theme.colors.warning}
        />
        <StatCard
          IconComponent={Zap}
          label="Sampling"
          value="200"
          unit="Hz"
          color={Theme.colors.accent}
        />
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  statusBarSpacer: {
    height: Platform.OS === 'android' ? RNStatusBar.currentHeight + 10 : 40,
  },
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.lg,
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: Theme.colors.surfaceLow,
    borderRadius: Theme.roundness.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    ...Theme.shadow.card,
  },
  headerLeft: {
    flex: 1,
  },
  monitoringLabel: {
    fontSize: 24,
    fontWeight: '900',
    color: Theme.colors.text,
    letterSpacing: 1,
  },
  monitoringStatus: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: -4,
  },
  patientLabel: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  connectButton: {
    width: 48,
    height: 48,
    borderRadius: Theme.roundness.md,
    backgroundColor: Theme.colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonActive: {
    backgroundColor: Theme.colors.primaryDim,
    ...Theme.shadow.glow,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Theme.spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.roundness.full,
    gap: 8,
  },
  statusConnected: {
    backgroundColor: Theme.colors.liveDim,
    borderWidth: 1,
    borderColor: Theme.colors.live,
  },
  statusDisconnected: {
    backgroundColor: Theme.colors.errorDim,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  leadsOffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.roundness.full,
    backgroundColor: Theme.colors.errorDim,
    gap: 6,
  },
  leadsOffText: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.error,
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: Theme.spacing.lg,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.liveDim,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.roundness.full,
    gap: 8,
  },
  infoBadgeText: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionContainer: {
    backgroundColor: Theme.colors.surfaceLow,
    borderRadius: Theme.roundness.xl,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    ...Theme.shadow.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm + 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.roundness.full,
    backgroundColor: Theme.colors.surfaceHigh,
  },
  liveBadgeActive: {
    backgroundColor: Theme.colors.liveDim,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.textMuted,
  },
  liveDotActive: {
    backgroundColor: Theme.colors.primary,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  liveTextActive: {
    color: Theme.colors.primary,
  },
  graphFooter: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  graphLabel: {
    color: 'rgba(148, 163, 184, 0.4)',
    fontSize: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.sm + 4,
    marginBottom: Theme.spacing.sm + 4,
  },
});

export default HomeScreen;
