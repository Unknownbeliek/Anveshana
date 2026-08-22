const mongoose = require('mongoose');

/**
 * AuditAlert — immutable log of anomaly events raised by the system.
 * Write-once (no update allowed) to guarantee tamper-proof audit trail.
 */
const AuditAlertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true, index: true },
  type: {
    type: String,
    required: true,
    enum: [
      'CAPACITY_BREACH_ANOMALY',    // Volume > biological NDLM capacity
      'BIOLOGICAL_DRIFT_ALERT',     // FAT/SNF ratio drifted >2σ from 30-day baseline
      'TRANSIT_DENSITY_WARNING',    // CLR density change in transit (water dilution)
      'MASS_BALANCE_VIOLATION',     // Factory received more milk than dispatched
      'OFFLINE_SYNC_ANOMALY',       // Anomaly found inside a synced offline batch
      'TANKER_QUARANTINE'           // Tanker quarantined at factory gate
    ]
  },
  severity: { type: String, required: true, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
  centerId: { type: String, default: null },
  farmerCustomId: { type: String, default: null },
  farmerName: { type: String, default: null },
  batchId: { type: String, default: null },
  message: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  isResolved: { type: Boolean, default: false }
}, {
  timestamps: false,
  // Prevent accidental updates
  statics: {
    forbidUpdate: true
  }
});

// Index for auditor feed
AuditAlertSchema.index({ severity: 1, isResolved: 1, timestamp: -1 });

module.exports = mongoose.model('AuditAlert', AuditAlertSchema);
