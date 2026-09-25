import { apiClient } from './apiClient';

export const aiService = {
  async getInsights(userProfile, ecgAnalysisResults, rawMetrics) {
    try {
      const response = await apiClient.post('/analysis/ai-insights', {
        analysisResults: ecgAnalysisResults,
        rawMetrics,
        userAge: userProfile?.age,
        medicalHistory: userProfile?.medicalHistory || 'None reported',
      });
      return { error: false, message: response.data.insights };
    } catch (err) {
      console.error('AI insights error:', err.message);
      return { error: true, message: 'Unable to generate insights. Check your connection.' };
    }
  },
};
