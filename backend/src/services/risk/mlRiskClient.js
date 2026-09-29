const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT_MS = parseInt(process.env.ML_SERVICE_TIMEOUT_MS, 10) || 2000;

class MLRiskClient {
  constructor(baseUrl = ML_SERVICE_URL, timeout = ML_TIMEOUT_MS) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
    });
  }

  async predictRisk(features) {
    try {
      const response = await this.client.post('/api/ml/predict', {
        action: features.action || 'read',
        toolCategory: features.toolCategory || 'READ',
        toolSensitivity: features.toolSensitivity || 'INTERNAL',
        dataType: features.dataType || 'internal',
        destinationType: features.destinationType || 'trusted_internal',
        volume: features.volume || 1,
        agentRole: features.agentRole || 'support_agent',
        hourOfDay: features.hourOfDay !== undefined ? features.hourOfDay : new Date().getHours(),
        recentFailedActions: features.recentFailedActions || 0,
      });

      return {
        modelVersion: response.data.modelVersion,
        predictedRisk: response.data.predictedRisk,
        probabilities: response.data.probabilities,
        latencyMs: response.data.latencyMs,
      };
    } catch (err) {
      console.warn(`[MLRiskClient] Inference failed (${err.message}). Using deterministic fallback.`);
      return null;
    }
  }

  async checkHealth() {
    try {
      const res = await this.client.get('/health');
      return res.data;
    } catch (err) {
      return { status: 'unreachable', error: err.message };
    }
  }
}

module.exports = new MLRiskClient();
