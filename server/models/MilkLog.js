const mongoose = require('mongoose');

/**
 * MilkLog — Time-Series optimised collection for 30-Day Biological Drift detection.
 * Stored as a MongoDB Time Series Collection via timeseries option.
 * Each document represents a single validated milk deposit event.
 */
const QualityMetricsSchema = new mongoose.Schema({
  fat: { type: Number, required: true, min: 0, max: 15 },     // % fat content
  snf: { type: Number, required: true, min: 0, max: 15 },     // % solids-not-fat
  clrDensity: { type: Number, required: true, min: 25, max: 35 } // CLR lactometer reading
}, { _id: false });

const BiologicalDriftSchema = new mongoose.Schema({
  fatSnfRatio: { type: Number },        // FAT / SNF ratio (expected: 0.45–0.55)
  fatSnfDrift: { type: Number },        // deviation from 30-day rolling average
  driftFlag: { type: Boolean, default: false },
  driftSeverity: { type: String, enum: ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'NONE' }
}, { _id: false });

const MilkLogSchema = new mongoose.Schema({
  depositId: { type: String, required: true, unique: true, index: true },

  // Normalized references (Zero-Trust isolation)
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true, index: true },
  farmerCustomId: { type: String, required: true, index: true },
  farmerName: { type: String, required: true },
  agentId: { type: String, default: null },     // Collection agent ID
  centerId: { type: String, required: true },   // Collection center code

  // Core data
  volumeLiters: { type: Number, required: true, min: 0, max: 500 },
  qualityMetrics: { type: QualityMetricsSchema, required: true },
  calculatedPayout: { type: Number, required: true, min: 0 },

  // Biological Drift detection result
  biologicalDrift: { type: BiologicalDriftSchema, default: () => ({}) },

  // Cryptographic integrity
  receiptHash: { type: String, required: true },

  // Fraud detection flags
  isFlagged: { type: Boolean, default: false, index: true },
  flagReason: { type: String, default: null },
  flags: { type: [String], default: [] },

  // Sync provenance
  syncSource: { type: String, enum: ['DIRECT_ONLINE', 'OFFLINE_BUFFER_SYNC', 'MANUAL_ADMIN_ENTRY'], default: 'DIRECT_ONLINE' },
  isSynced: { type: Boolean, default: true },

  // Time-series metadata field
  timestamp: { type: Date, required: true, default: Date.now, index: true }
}, {
  // Standard schema (actual TS collection created in db.js)
  timestamps: { createdAt: 'recordedAt', updatedAt: false }
});

// Compound index for fast farmer passbook queries
MilkLogSchema.index({ farmerCustomId: 1, timestamp: -1 });

// Compound index for Biological Drift 30-day window queries
MilkLogSchema.index({ farmerCustomId: 1, timestamp: 1, 'qualityMetrics.fat': 1, 'qualityMetrics.snf': 1 });

// Index for auditor anomaly feed
MilkLogSchema.index({ isFlagged: 1, timestamp: -1 });

module.exports = mongoose.model('MilkLog', MilkLogSchema);
