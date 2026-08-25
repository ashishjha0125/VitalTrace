import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

export const pdfService = {
  generateAndShareReport: async (userProfile, rawMetrics, analysisResults, aiInsights) => {
    try {
      const dateStr = new Date().toLocaleString();
      
      // Format Analysis Results
      const analysisHtml = analysisResults.map(r => `
        <div class="metric-row">
          <span class="metric-icon">${r.icon}</span>
          <div class="metric-text">
            <strong>${r.name}</strong> <span class="status ${r.status.toLowerCase()}">${r.status}</span>
            <p>${r.message}</p>
          </div>
        </div>
      `).join('');

      // Format Metrics
      const metricsHtml = Object.entries(rawMetrics).map(([key, val]) => `
        <div class="stat-box">
          <div class="stat-value">${val}</div>
          <div class="stat-label">${key}</div>
        </div>
      `).join('');

      // HTML Template
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #ef4444; font-size: 28px; }
            .header p { margin: 5px 0 0; color: #666; }
            
            .section { margin-bottom: 30px; background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .section-title { font-size: 18px; color: #111; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
            
            .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .profile-item { margin-bottom: 5px; }
            .profile-label { font-weight: bold; color: #555; }
            
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; }
            .stat-box { background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; }
            .stat-value { font-size: 24px; font-weight: bold; color: #ef4444; }
            .stat-label { font-size: 12px; color: #666; text-transform: uppercase; margin-top: 5px; }
            
            .metric-row { display: flex; align-items: flex-start; margin-bottom: 15px; background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; }
            .metric-icon { font-size: 24px; margin-right: 15px; }
            .metric-text p { margin: 5px 0 0; font-size: 14px; color: #444; }
            .status { font-size: 12px; font-weight: bold; padding: 2px 6px; border-radius: 4px; }
            .status.normal { background: #dcfce7; color: #166534; }
            .status.warning { background: #fef08a; color: #854d0e; }
            .status.critical { background: #fee2e2; color: #991b1b; }
            
            .ai-insights { background: #eff6ff; border: 1px solid #bfdbfe; }
            .ai-content { font-size: 14px; line-height: 1.6; color: #1e3a8a; white-space: pre-wrap; }
            
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>VitalTrace ECG</h1>
            <p>Clinical Cardiovascular Report</p>
            <p>Generated: ${dateStr}</p>
          </div>

          <div class="section">
            <h2 class="section-title">Patient Profile</h2>
            <div class="profile-grid">
              <div class="profile-item"><span class="profile-label">Name:</span> ${escapeHtml(userProfile?.name) || 'N/A'}</div>
              <div class="profile-item"><span class="profile-label">Age:</span> ${userProfile?.age || 'N/A'}</div>
              <div class="profile-item" style="grid-column: span 2;"><span class="profile-label">Medical History:</span> ${escapeHtml(userProfile?.medicalHistory) || 'None reported'}</div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Key Metrics</h2>
            <div class="stats-grid">
              ${metricsHtml}
            </div>
          </div>

          <div class="section ai-insights">
            <h2 class="section-title" style="color: #1d4ed8; border-color: #bfdbfe;">🤖 AI Clinical Insights</h2>
            <div class="ai-content">${escapeHtml(aiInsights) || 'No AI insights were generated for this report.'}</div>
          </div>

          <div class="section">
            <h2 class="section-title">Detailed Algorithm Analysis</h2>
            ${analysisHtml}
          </div>

          <div class="footer">
            Disclaimer: This report is generated automatically and includes AI-assisted insights. 
            It is not a substitute for professional medical advice, diagnosis, or treatment. 
            Always consult a qualified healthcare provider.
          </div>
        </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      console.log('PDF Generated at:', uri);

      // Share PDF
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share ECG Report',
          UTI: 'com.adobe.pdf'
        });
      } else {
        console.warn('Sharing is not available on this platform');
      }
      
      return { success: true, uri };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return { success: false, error: error.message };
    }
  }
};
