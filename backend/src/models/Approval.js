const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema(
  {
    actionRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ActionRequest',
      required: true,
    },
    actionId: {
      type: String,
      required: true,
      index: true,
    },
    agentId: {
      type: String,
      required: true,
    },
    toolId: {
      type: String,
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    approvalToken: {
      type: String,
      required: true,
      unique: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    decidedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Approval', approvalSchema);
