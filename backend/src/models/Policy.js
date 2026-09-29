const mongoose = require('mongoose');

const policySchema = new mongoose.Schema(
  {
    policyId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    priority: {
      type: Number,
      required: true,
      default: 50,
      index: true,
    },
    conditions: {
      actionTypes: [{ type: String }],
      toolIds: [{ type: String }],
      destinations: [{ type: String }],
      sensitivityLevels: [{ type: String }],
      containsPii: { type: Boolean },
      containsSecrets: { type: Boolean },
      volumeThreshold: { type: Number },
    },
    decision: {
      type: String,
      enum: ['ALLOW', 'APPROVAL_REQUIRED', 'BLOCK'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    isHardDeny: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Policy', policySchema);
