const mongoose = require('mongoose');

/**
 * Batch — groups multiple MilkLog IDs into an aggregated tanker manifest.
 * Used for factory-gate mass-balance reconciliation (QC Dashboard).
 */
const ReconciliationSchema = new mongoose.Schema({
  receivedVolume: { type: Number, required: true },
  receivedFat: { type: Number },
  receivedSnf: { type: Number },
  receivedClr: { type: Number },
  volumeVariancePercent: { type: Number }, // (received - dispatched) / dispatched * 100
  isTampered: { type: Boolean, default: false },
  quarantineReason: { type: String, default: null },
  reconciledAt: { type: Date, required: true, default: Date.now },
  qcOfficerId: { type: String, required: true }
}, { _id: false });

const BatchSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true, index: true },

  // Source
  centerId: { type: String, required: true, index: true },
  centerName: { type: String, required: true },

  // Normalized deposit references (Zero-Trust: logs grouped, not duplicated)
  depositIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MilkLog' }],

  // Dispatch manifest
  dispatchedVolume: { type: Number, required: true },
  dispatchedWeightedFat: { type: Number, required: true },
  dispatchedWeightedSnf: { type: Number, required: true },
  dispatchedClr: { type: Number },
  tankerNumber: { type: String, required: true },
  driverName: { type: String },

  // Status lifecycle: AGGREGATING → DISPATCHED → IN_TRANSIT → VERIFIED_AT_FACTORY | QUARANTINED
  status: {
    type: String,
    required: true,
    default: 'AGGREGATING',
    enum: ['AGGREGATING', 'DISPATCHED', 'IN_TRANSIT', 'VERIFIED_AT_FACTORY', 'QUARANTINED', 'DISPUTED']
  },

  // Factory gate reconciliation
  reconciliationData: { type: ReconciliationSchema, default: null },

  // Cryptographic manifest seal (SHA-256 of all depositIds + volumes + fat + snf)
  manifestHash: { type: String, required: true }
}, { timestamps: true });

// Index for auditor district-level analytics
BatchSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Batch', BatchSchema);
