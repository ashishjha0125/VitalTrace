import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stethoscope, RefreshCw, Activity, Share, Sparkles } from 'lucide-react-native';
import AnalysisCard from '../components/AnalysisCard';
import { Theme } from '../theme/theme';
import { aiService } from '../services/aiService';
import { pdfService } from '../services/pdfService';
import { supabase } from '../services/supabaseClient';
import { cloudService } from '../services/cloudService';

const ReportsScreen = ({ analysisResults = [], isConnected, onRunAnalysis, dataReady, rawMetrics = {} }) => {
  const [grokInsights, setGrokInsights] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await cloudService.getUserProfile(session.user.id);
        setCurrentUser(profile);
      }
    });
  }, []);

  const handleGetInsights = async () => {
    if (analysisResults.length === 0) return;
    setIsAiLoading(true);
    const result = await aiService.getInsights(currentUser, analysisResults, rawMetrics);
    setIsAiLoading(false);
    
    if (result.error) {
      Alert.alert('AI Error', result.message);
    } else {
      setGrokInsights(result.message);
    }
  };

  const handleExportPDF = async () => {
    if (analysisResults.length === 0) return;
    const result = await pdfService.generateAndShareReport(currentUser, rawMetrics, analysisResults, grokInsights);
    if (!result.success) {
      Alert.alert('PDF Error', result.error);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>AI Diagnostics</Text>
      <Text style={styles.screenSubtitle}>Real-time cardiovascular analysis</Text>

      {/* Analysis Info Banner */}
      <View style={styles.infoBanner}>
        <View style={styles.infoLeft}>
          <Stethoscope size={22} color={Theme.colors.primary} />
          <View>
            <Text style={styles.infoTitle}>Signal Analyzer</Text>
            <Text style={styles.infoSubtitle}>
              {analysisResults.length > 0 
                ? `${analysisResults.length} metrics analyzed`
                : 'Awaiting ECG data'
              }
            </Text>
          </View>
        </View>
        <View style={[styles.analysisDot, { 
          backgroundColor: analysisResults.length > 0 ? Theme.colors.success : Theme.colors.textMuted 
        }]} />
      </View>

      {/* Run Analysis Button */}
      <TouchableOpacity 
        style={[styles.analyzeButton, !dataReady && styles.analyzeButtonDisabled]}
        onPress={onRunAnalysis}
        disabled={!dataReady}
        activeOpacity={0.7}
      >
        <RefreshCw size={18} color={dataReady ? Theme.colors.background : Theme.colors.textMuted} />
        <Text style={[styles.analyzeButtonText, !dataReady && styles.analyzeButtonTextDisabled]}>
          {dataReady ? 'Run Analysis Now' : 'Collecting Data...'}
        </Text>
      </TouchableOpacity>

      {/* Progress indicator when no results */}
      {analysisResults.length === 0 && (
        <View style={styles.waitingCard}>
          <View style={styles.waitingIconWrapper}>
            <Activity color={Theme.colors.primary} size={44} />
          </View>
          <Text style={styles.waitingTitle}>Waiting for Data</Text>
          <Text style={styles.waitingText}>
            {isConnected 
              ? 'Collecting at least 5 seconds of ECG data for analysis...'
              : 'Connect your VitalTrace device to begin AI diagnostics.'
            }
          </Text>
          {isConnected && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: dataReady ? '100%' : '30%' }]} />
              </View>
              <Text style={styles.progressText}>{dataReady ? 'Ready' : 'Collecting...'}</Text>
            </View>
          )}
        </View>
      )}

      {/* Analysis Results */}
      {analysisResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.md}}>
            <Text style={styles.resultsHeader}>Analysis Results</Text>
            <TouchableOpacity style={styles.pdfButton} onPress={handleExportPDF}>
              <Share size={14} color="#FFF" style={{marginRight: 4}} />
              <Text style={styles.pdfButtonText}>PDF Report</Text>
            </TouchableOpacity>
          </View>
          
          {analysisResults.map((result, index) => (
            <AnalysisCard
              key={index}
              icon={result.icon}
              name={result.name}
              status={result.status}
              message={result.message}
              isOverall={result.isOverall}
            />
          ))}

          {/* AI Insights Section */}
          <View style={styles.aiSection}>
            <View style={styles.aiHeader}>
              <Sparkles size={20} color={Theme.colors.ai} />
              <Text style={styles.aiTitle}>AI Clinical Insights</Text>
            </View>
            
            {grokInsights ? (
              <View style={styles.aiContentBox}>
                <Text style={styles.aiContent}>{grokInsights}</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.aiButton} onPress={handleGetInsights} disabled={isAiLoading}>
                {isAiLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.aiButtonText}>Generate Personalized AI Insights</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <View style={{flexDirection: 'row', alignItems: 'flex-start', gap: 8}}>
          <Stethoscope size={16} color={Theme.colors.warning} style={{marginTop: 2}} />
          <Text style={styles.disclaimerText}>
            This analysis is for educational purposes only and should not be used for medical diagnosis. 
            Always consult a healthcare professional.
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
  infoBanner: {
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
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  infoSubtitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  analysisDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.roundness.md,
    paddingVertical: 14,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadow.glow,
  },
  analyzeButtonDisabled: {
    backgroundColor: Theme.colors.surfaceHigh,
    shadowOpacity: 0,
  },
  analyzeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.background,
  },
  analyzeButtonTextDisabled: {
    color: Theme.colors.textMuted,
  },
  waitingCard: {
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceLow,
    borderRadius: Theme.roundness.xl,
    padding: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    borderStyle: 'dashed',
  },
  waitingIconWrapper: {
    marginBottom: Theme.spacing.md,
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginBottom: 8,
  },
  waitingText: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 200,
    marginTop: Theme.spacing.md,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.surfaceHigh,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Theme.colors.primary,
  },
  progressText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 6,
    fontWeight: '600',
  },
  resultsContainer: {
    marginBottom: Theme.spacing.md,
  },
  resultsHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  disclaimer: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  disclaimerText: {
    fontSize: 12,
    color: Theme.colors.warning,
    lineHeight: 18,
    textAlign: 'center',
  },
  pdfButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  pdfButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  aiSection: {
    marginTop: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.ai,
    marginLeft: 8,
  },
  aiButton: {
    backgroundColor: Theme.colors.ai,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  aiButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  aiContentBox: {
    backgroundColor: Theme.colors.surface,
    padding: 12,
    borderRadius: 8,
  },
  aiContent: {
    color: Theme.colors.text,
    fontSize: 14,
    lineHeight: 22,
  }
});

export default ReportsScreen;
