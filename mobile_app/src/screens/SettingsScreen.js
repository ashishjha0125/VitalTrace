import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Sliders, Bluetooth, Info, ChevronRight, Shield, Cpu, Minus, Plus } from 'lucide-react-native';
import FilterCard from '../components/FilterCard';
import { Theme } from '../theme/theme';
import { storageService } from '../services/storageService';

const Slider = ({ value, min, max, step, onValueChange, label }) => {
  const percentage = ((value - min) / (max - min)) * 100;

  const handleMinus = () => {
    if (value - step >= min) onValueChange(value - step);
  };

  const handlePlus = () => {
    if (value + step <= max) onValueChange(value + step);
  };

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.labelRow}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={sliderStyles.value}>{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}</Text>
      </View>
      <View style={sliderStyles.controlsRow}>
        <TouchableOpacity style={sliderStyles.btn} onPress={handleMinus}>
          <Minus size={16} color={Theme.colors.text} />
        </TouchableOpacity>
        
        <View style={sliderStyles.trackContainer}>
          <View style={sliderStyles.track}>
            <View style={[sliderStyles.fill, { width: `${percentage}%` }]} />
            <View style={[sliderStyles.thumb, { left: `${percentage}%` }]} />
          </View>
        </View>

        <TouchableOpacity style={sliderStyles.btn} onPress={handlePlus}>
          <Plus size={16} color={Theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  container: { marginTop: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 13, color: Theme.colors.textSecondary, fontWeight: '500' },
  value: { fontSize: 14, fontWeight: '800', color: Theme.colors.primary },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Theme.colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  trackContainer: { flex: 1, height: 20, justifyContent: 'center', paddingHorizontal: 8 },
  track: { height: 6, backgroundColor: Theme.colors.surfaceHigh, borderRadius: 3, position: 'relative', width: '100%' },
  fill: { height: '100%', backgroundColor: Theme.colors.primary, borderRadius: 3 },
  thumb: { position: 'absolute', top: -7, width: 20, height: 20, borderRadius: 10, backgroundColor: Theme.colors.text, marginLeft: -10, ...Theme.shadow.glow },
});

const SettingsScreen = ({
  filterSettings,
  onFilterChange,
  isConnected,
  totalSamples,
  sampleRate,
  onToggleRaw,
  showRaw,
}) => {
  const [lpfCutoff, setLpfCutoff] = useState(filterSettings.lpfCutoff || 40);
  const [hpfCutoff, setHpfCutoff] = useState(filterSettings.hpfCutoff || 0.5);
  const [maWindow, setMaWindow] = useState(filterSettings.maWindow || 3);

  const handleLpfCutoffChange = (val) => {
    // JS floats are annoying
    const newVal = Math.round(val * 10) / 10;
    setLpfCutoff(newVal);
    onFilterChange('lpfCutoff', newVal);
  };

  const handleHpfCutoffChange = (val) => {
    const newVal = Math.round(val * 10) / 10;
    setHpfCutoff(newVal);
    onFilterChange('hpfCutoff', newVal);
  };

  const handleMaWindowChange = (val) => {
    const newVal = Math.round(val);
    setMaWindow(newVal);
    onFilterChange('maWindow', newVal);
  };

  const activeFilters = [
    filterSettings.lowPass, 
    filterSettings.highPass, 
    filterSettings.notch, 
    filterSettings.movingAvg
  ].filter(Boolean).length;

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Settings</Text>
      <Text style={styles.screenSubtitle}>Signal filters & device configuration</Text>

      {/* Signal Filters Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Sliders size={18} color={Theme.colors.primary} />
          <Text style={styles.sectionTitle}>Signal Filters</Text>
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFilters} active</Text>
          </View>
        </View>

        <FilterCard
          name="Low-Pass Filter"
          description="Remove high-frequency noise"
          enabled={filterSettings.lowPass}
          onToggle={() => onFilterChange('lowPass', !filterSettings.lowPass)}
        >
          <Slider
            value={lpfCutoff}
            min={10}
            max={80}
            step={5}
            onValueChange={handleLpfCutoffChange}
            label={`Cutoff: ${lpfCutoff} Hz`}
          />
        </FilterCard>

        <FilterCard
          name="High-Pass Filter"
          description="Remove baseline wander"
          enabled={filterSettings.highPass}
          onToggle={() => onFilterChange('highPass', !filterSettings.highPass)}
        >
          <Slider
            value={hpfCutoff}
            min={0.1}
            max={2}
            step={0.1}
            onValueChange={handleHpfCutoffChange}
            label={`Cutoff: ${hpfCutoff.toFixed(1)} Hz`}
          />
        </FilterCard>

        <FilterCard
          name="Notch Filter (50Hz)"
          description="Remove power line noise"
          enabled={filterSettings.notch}
          onToggle={() => onFilterChange('notch', !filterSettings.notch)}
        >
          <View style={styles.notchOptions}>
            <TouchableOpacity
              style={[styles.notchOption, filterSettings.notchFreq === 50 && styles.notchOptionActive]}
              onPress={() => onFilterChange('notchFreq', 50)}
            >
              <Text style={[styles.notchOptionText, filterSettings.notchFreq === 50 && styles.notchOptionTextActive]}>
                50 Hz (India/EU)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.notchOption, filterSettings.notchFreq === 60 && styles.notchOptionActive]}
              onPress={() => onFilterChange('notchFreq', 60)}
            >
              <Text style={[styles.notchOptionText, filterSettings.notchFreq === 60 && styles.notchOptionTextActive]}>
                60 Hz (US)
              </Text>
            </TouchableOpacity>
          </View>
        </FilterCard>

        <FilterCard
          name="Moving Average"
          description="Smooth remaining noise"
          enabled={filterSettings.movingAvg}
          onToggle={() => onFilterChange('movingAvg', !filterSettings.movingAvg)}
        >
          <Slider
            value={maWindow}
            min={1}
            max={15}
            step={1}
            onValueChange={handleMaWindowChange}
            label={`Window: ${maWindow} samples`}
          />
        </FilterCard>
      </View>


      {/* Display Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Cpu size={18} color={Theme.colors.secondary} />
          <Text style={styles.sectionTitle}>Display</Text>
        </View>

        <TouchableOpacity style={styles.settingRow} onPress={onToggleRaw}>
          <View>
            <Text style={styles.settingLabel}>Signal View</Text>
            <Text style={styles.settingValue}>{showRaw ? 'Raw Signal' : 'Filtered Signal'}</Text>
          </View>
          <View style={[styles.togglePill, showRaw && styles.togglePillActive]}>
            <Text style={[styles.togglePillText, showRaw && styles.togglePillTextActive]}>
              {showRaw ? 'RAW' : 'FILTERED'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Device Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Bluetooth size={18} color={Theme.colors.accent} />
          <Text style={styles.sectionTitle}>Device Info</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Connection</Text>
          <Text style={[styles.infoValue, { color: isConnected ? Theme.colors.success : Theme.colors.error }]}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Device Name</Text>
          <Text style={styles.infoValue}>VitalTrace_ECG</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Protocol</Text>
          <Text style={styles.infoValue}>Bluetooth LE (BLE)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Sample Rate</Text>
          <Text style={styles.infoValue}>{sampleRate} Hz</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total Samples</Text>
          <Text style={styles.infoValue}>{totalSamples.toLocaleString()}</Text>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Shield size={18} color={Theme.colors.warning} />
          <Text style={styles.sectionTitle}>About</Text>
        </View>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>VitalTrace ECG Monitor</Text>
          <Text style={styles.aboutVersion}>v1.0.0</Text>
          <Text style={styles.aboutText}>
            Real-time ECG monitoring system with ESP32 + AD8232 hardware and advanced digital signal processing.
          </Text>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6}}>
            <Shield size={14} color={Theme.colors.warning} />
            <Text style={styles.disclaimerSmall}>
              For educational and research purposes only. Not a certified medical device.
            </Text>
          </View>
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
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
    flex: 1,
  },
  filterBadge: {
    backgroundColor: Theme.colors.successDim,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Theme.roundness.full,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.success,
  },
  notchOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  notchOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Theme.roundness.sm,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  notchOptionActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryDim,
  },
  notchOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  notchOptionTextActive: {
    color: Theme.colors.primary,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceLow,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  settingValue: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  togglePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.roundness.full,
    backgroundColor: Theme.colors.surfaceHigh,
  },
  togglePillActive: {
    backgroundColor: Theme.colors.warningDim,
  },
  togglePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  togglePillTextActive: {
    color: Theme.colors.warning,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 51, 85, 0.2)',
  },
  infoLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  aboutCard: {
    backgroundColor: Theme.colors.surfaceLow,
    borderRadius: Theme.roundness.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.md,
  },
  aboutText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Theme.spacing.md,
  },
  disclaimerSmall: {
    fontSize: 11,
    color: Theme.colors.warning,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default SettingsScreen;
