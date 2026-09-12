const axios = require('axios');
const { analysisSchema } = require('../utils/validators');

const getAIInsights = async (req, res, next) => {
  try {
    const { error, value } = analysisSchema.validate(req.body);
    if (error) return next(error);

    const { analysisResults, rawMetrics, userAge, medicalHistory } = value;

    const prompt = `
You are a medical AI assistant analyzing ECG data for a patient.
Patient Profile:
- Age: ${userAge || 'Unknown'}
- Medical History: ${medicalHistory || 'None reported'}

ECG Metrics:
${JSON.stringify(rawMetrics, null, 2)}

Analysis Results:
${JSON.stringify(analysisResults, null, 2)}

Please provide a concise, professional assessment of these findings, highlighting any potential concerns. Do not provide a formal diagnosis.
`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    res.json({ insights: aiResponse });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAIInsights };
