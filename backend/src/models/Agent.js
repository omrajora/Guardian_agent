const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema(
  {
    agentId: {
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
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    permissions: [
      {
        type: String,
      },
    ],
    allowedTools: [
      {
        type: String,
      },
    ],
    apiKeyHash: {
      type: String,
      required: true,
    },
    apiKeyPrefix: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'revoked', 'sandbox'],
      default: 'active',
    },
    baseline: {
      normalCallsPerHour: { type: Number, default: 100 },
      normalRecordsPerRequest: { type: Number, default: 50 },
      typicalDestinations: [{ type: String }],
      typicalActions: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Agent', agentSchema);
