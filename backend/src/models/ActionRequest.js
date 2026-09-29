const mongoose = require('mongoose');

const actionRequestSchema = new mongoose.Schema(
  {
    actionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    agentId: {
      type: String,
      required: true,
      index: true,
    },
    toolId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sanitizedParameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    destination: {
      type: String,
    },
    features: {
      action: String,
      toolCategory: String,
      toolSensitivity: String,
      dataType: String,
      destinationType: String,
      volume: Number,
      agentRole: String,
      hourOfDay: Number,
      recentFailedActions: Number,
    },
    findings: {
      piiDetected: { type: Boolean, default: false },
      piiTypes: [{ type: String }],
      secretsDetected: { type: Boolean, default: false },
      matchedPolicies: [{ type: String }],
    },
    mlInference: {
      modelVersion: String,
      predictedRisk: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      },
      probabilities: {
        LOW: Number,
        MEDIUM: Number,
        HIGH: Number,
        CRITICAL: Number,
      },
      latencyMs: Number,
    },
    anomalyInference: {
      anomalyScore: Number,
      isAnomaly: Boolean,
      deviationFactors: [{ type: String }],
    },
    llmAnalysis: {
      intent: String,
      injectionSuspicion: {
        type: String,
        enum: ['NONE', 'LOW', 'MEDIUM', 'HIGH'],
      },
      contextExplanation: String,
      riskRationale: String,
    },
    finalRiskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    decision: {
      type: String,
      enum: ['ALLOW', 'APPROVAL_REQUIRED', 'BLOCK'],
      required: true,
    },
    decisionReason: {
      type: String,
      required: true,
    },
    executionStatus: {
      type: String,
      enum: ['PENDING', 'EXECUTED', 'BLOCKED', 'FAILED', 'WAITING_APPROVAL'],
      default: 'PENDING',
    },
    executionResult: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ActionRequest', actionRequestSchema);
