import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Clock, Heart, Activity, Trash2, CalendarDays } from 'lucide-react-native';
import { Theme } from '../theme/theme';

const HistoryScreen = ({ sessions = [], onClearHistory }) => {

  const confirmClear = () => {
    Alert.alert('Clear History', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: onClearHistory },
    ]);
  };
  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const reversedSessions = sessions.slice().reverse();

  const renderSession = ({ item: session }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionDate}>
          <Text style={styles.sessionDateText}>{formatDate(session.startTime)}</Text>
          <Text style={styles.sessionTimeText}>{formatTime(session.startTime)}</Text>
        </View>
        <View style={[styles.sessionStatusBadge, { 
          backgroundColor: session.quality === 'Good' ? Theme.colors.successDim : Theme.colors.warningDim 
        }]}>
          <Text style={[styles.sessionStatusText, { 
            color: session.quality === 'Good' ? Theme.colors.success : Theme.colors.warning 
          }]}>
            {session.quality || 'N/A'}
          </Text>
        </View>
      </View>
      
      <View style={styles.sessionStats}>
        <View style={styles.sessionStat}>
          <Heart size={14} color={Theme.colors.primary} />
          <Text style={styles.sessionStatValue}>{session.avgBpm || '--'}</Text>
          <Text style={styles.sessionStatUnit}>avg BPM</Text>
        </View>
        <View style={styles.sessionStat}>
          <Clock size={14} color={Theme.colors.textMuted} />
          <Text style={styles.sessionStatValue}>
            {session.duration ? formatDuration(session.duration) : '--'}
          </Text>
        </View>
        <View style={styles.sessionStat}>
          <Activity size={14} color={Theme.colors.accent} />
          <Text style={styles.sessionStatValue}>{session.totalSamples || 0}</Text>
          <Text style={styles.sessionStatUnit}>samples</Text>
        </View>
      </View>
    </View>
  );

  const ListHeader = () => (
    <>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>History</Text>
          <Text style={styles.screenSubtitle}>Past monitoring sessions</Text>
        </View>
        {sessions.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={confirmClear}>
            <Trash2 size={16} color={Theme.colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Session Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <CalendarDays size={20} color={Theme.colors.primary} />
          <Text style={styles.summaryValue}>{sessions.length}</Text>
          <Text style={styles.summaryLabel}>Sessions</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Clock size={20} color={Theme.colors.secondary} />
          <Text style={styles.summaryValue}>
            {sessions.length > 0 
              ? formatDuration(sessions.reduce((a, s) => a + (s.duration || 0), 0))
              : '0s'
            }
          </Text>
          <Text style={styles.summaryLabel}>Total Time</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Heart size={20} color={Theme.colors.error} />
          <Text style={styles.summaryValue}>
            {sessions.length > 0 
              ? Math.round(sessions.reduce((a, s) => a + (s.avgBpm || 0), 0) / sessions.length)
              : '--'
            }
          </Text>
          <Text style={styles.summaryLabel}>Avg BPM</Text>
        </View>
      </View>
    </>
  );

  const EmptyList = () => (
    <View style={styles.emptyState}>
      <Clock size={56} color={Theme.colors.textMuted} strokeWidth={1} />
      <Text style={styles.emptyTitle}>No Sessions Yet</Text>
      <Text style={styles.emptySubtitle}>
        Connect your VitalTrace device and start monitoring to build your history.
      </Text>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={reversedSessions}
      keyExtractor={(item) => item.startTime.toString()}
      renderItem={renderSession}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={EmptyList}
      ListFooterComponent={<View style={{ height: 20 }} />}
      showsVerticalScrollIndicator={false}
    />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.xl,
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
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.roundness.md,
    backgroundColor: Theme.colors.errorDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceLow,
    borderRadius: Theme.roundness.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.text,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Theme.colors.outline,
    marginVertical: 4,
  },
  sessionCard: {
    backgroundColor: Theme.colors.surfaceLow,
    borderRadius: Theme.roundness.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm + 4,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm + 4,
  },
  sessionDate: {},
  sessionDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  sessionTimeText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  sessionStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.roundness.full,
  },
  sessionStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: Theme.spacing.lg,
  },
  sessionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  sessionStatUnit: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.lg,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 280,
  },
});

export default HistoryScreen;
