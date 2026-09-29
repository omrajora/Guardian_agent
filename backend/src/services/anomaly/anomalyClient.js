const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT_MS = parseInt(process.env.ML_SERVICE_TIMEOUT_MS, 10) || 2000;

class AnomalyClient {
  constructor(baseUrl = ML_SERVICE_URL, timeout = ML_TIMEOUT_MS) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
    });
  }

  async checkAnomaly({ agentId, requestsLastHour = 100, volumeRequested = 1, isNewDestination = false, failedRatioLastHour = 0 }) {
    try {
      const response = await this.client.post('/api/ml/anomaly', {
        agentId,
        requestsLastHour,
        volumeRequested,
        isNewDestination,
        failedRatioLastHour,
      });

      return {
        isAnomaly: response.data.isAnomaly,
        anomalyScore: response.data.anomalyScore,
        deviationFactors: response.data.deviationFactors,
      };
    } catch (err) {
      console.warn(`[AnomalyClient] Anomaly evaluation failed (${err.message}). Defaulting to normal.`);
      return null;
    }
  }
}

module.exports = new AnomalyClient();
