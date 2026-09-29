const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actionId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'EVALUATION',
        'EXECUTION',
        'BLOCK',
        'APPROVAL_REQUESTED',
        'APPROVAL_GRANTED',
        'APPROVAL_DENIED',
        'ANOMALY_TRIGGERED',
        'PII_DETECTED',
        'SECRET_DETECTED',
      ],
      required: true,
      index: true,
    },
    actor: {
      type: {
        type: String,
        enum: ['AGENT', 'USER', 'SYSTEM'],
        default: 'AGENT',
      },
      id: {
        type: String,
        required: true,
      },
    },
    decision: {
      type: String,
      enum: ['ALLOW', 'APPROVAL_REQUIRED', 'BLOCK'],
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
