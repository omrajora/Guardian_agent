const mongoose = require('mongoose');

const modelVersionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    algorithm: {
      type: String,
      enum: ['LogisticRegression', 'RandomForest', 'XGBoost', 'IsolationForest'],
      required: true,
    },
    datasetVersion: {
      type: String,
      default: 'v1.0.0',
    },
    metrics: {
      accuracy: Number,
      precision: Number,
      recall: Number,
      f1Score: Number,
      rocAuc: Number,
      latencyP95Ms: Number,
      confusionMatrix: [[Number]],
    },
    active: {
      type: Boolean,
      default: false,
    },
    weightsPath: {
      type: String,
    },
    featureColumns: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ModelVersion', modelVersionSchema);
