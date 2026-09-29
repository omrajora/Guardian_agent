const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema(
  {
    toolId: {
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
    category: {
      type: String,
      enum: ['READ', 'WRITE', 'DELETE', 'EXECUTE', 'EXPORT', 'COMMUNICATION'],
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    sensitivity: {
      type: String,
      enum: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'],
      default: 'INTERNAL',
    },
    schema: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    destinations: [
      {
        type: String,
      },
    ],
    isSensitive: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model('Tool', toolSchema);
