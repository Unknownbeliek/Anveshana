const { store } = require('../config/db');
const { generateManifestHash } = require('../utils/cryptoHash');

exports.getAllBatches = async (req, res) => {
  try {
    res.json({
      success: true,
      count: store.batches.length,
      batches: store.batches
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = store.batches.find(b => b.batchId === id || b._id === id);

    if (!batch) {
      return res.status(404).json({ success: false, message: `Batch ${id} not found.` });
    }

    res.json({ success: true, batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBatch = async (req, res) => {
  try {
    const { centerId, centerName, tankerNumber, driverName } = req.body;

    const targetCenter = centerId || 'CENT-EAST-04';
    // Aggregate open deposits for this center
    const deposits = store.deposits.filter(d => d.centerId === targetCenter);

    if (deposits.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No active milk deposits found for center ${targetCenter} to batch.`
      });
    }

    let totalVol = 0;
    let sumFatVol = 0;
    let sumSnfVol = 0;
    let sumClr = 0;

    const depositIds = [];
    for (const d of deposits) {
      const vol = Number(d.volumeLiters) || 0;
      totalVol += vol;
      sumFatVol += (Number(d.qualityMetrics.fat) || 0) * vol;
      sumSnfVol += (Number(d.qualityMetrics.snf) || 0) * vol;
      sumClr += (Number(d.qualityMetrics.clrDensity) || 29.0);
      depositIds.push(d._id);
    }

    const dispatchedWeightedFat = Number((sumFatVol / totalVol).toFixed(2));
    const dispatchedWeightedSnf = Number((sumSnfVol / totalVol).toFixed(2));
    const dispatchedClr = Number((sumClr / deposits.length).toFixed(1));
    const timestamp = new Date();
    const batchId = `BATCH-DEL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(store.batches.length + 1).padStart(2, '0')}`;

    const manifestHash = generateManifestHash({
      batchId,
      centerId: targetCenter,
      dispatchedVolume: totalVol,
      depositIds,
      timestamp: timestamp.toISOString()
    });

    const newBatch = {
      _id: `65f3c0${Date.now().toString(16).slice(-18)}`,
      batchId,
      centerId: targetCenter,
      centerName: centerName || 'East Delhi Aggregation Hub 04',
      depositIds,
      dispatchedVolume: Number(totalVol.toFixed(2)),
      dispatchedWeightedFat,
      dispatchedWeightedSnf,
      dispatchedClr,
      status: 'DISPATCHED',
      tankerNumber: tankerNumber || 'DL-1GB-9901',
      driverName: driverName || 'Rajendra Prasad (+91 98110 54321)',
      reconciliationData: null,
      manifestHash,
      createdAt: timestamp
    };

    store.batches.unshift(newBatch);

    const io = req.app.get('socketio');
    if (io) {
      io.emit('batch-dispatched', { batch: newBatch });
    }

    res.status(201).json({
      success: true,
      message: 'Transit Batch Manifest sealed and dispatched successfully.',
      batch: newBatch
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Mass-Balance Transit Reconciliation Controller
 * PRD Section 3.4 & 7.3
 */
exports.reconcileBatch = async (req, res) => {
  try {
    const { batchId, qcOfficerId, receivedVolume, receivedFat, receivedSnf, receivedClr } = req.body;

    if (!batchId || receivedVolume === undefined) {
      return res.status(400).json({
        success: false,
        message: 'batchId and receivedVolume are required for mass-balance audit.'
      });
    }

    const batch = store.batches.find(b => b.batchId === batchId || b._id === batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: `Batch ${batchId} not found in manifest log.` });
    }

    const vManifest = Number(batch.dispatchedVolume);
    const vFactory = Number(receivedVolume);
    const clrManifest = Number(batch.dispatchedClr || 29.0);
    const clrFactory = Number(receivedClr || 28.5);

    // Delta V = ((V_factory - V_manifest) / V_manifest) * 100
    const volumeVariancePercent = Number((((vFactory - vManifest) / vManifest) * 100).toFixed(2));
    const clrVariance = Number((clrFactory - clrManifest).toFixed(2));

    let status = 'VERIFIED_AT_FACTORY';
    let message = 'Mass-balance transit reconciliation verified within standard tolerance (±1.0%). Batch accepted for silo unloading.';
    let isQuarantine = false;

    // Check tolerances
    if (volumeVariancePercent > 1.0) {
      // Transit Volume Expansion / Water Addition
      status = 'QUARANTINED';
      isQuarantine = true;
      message = `CRITICAL: Mass-balance variance (+${volumeVariancePercent}%) exceeds +1.0% tolerance limit (Unauthorized volume expansion / water addition detected). Batch auto-quarantined.`;
    } else if (clrVariance <= -2.0) {
      // Chemical density drop
      status = 'QUARANTINED';
      isQuarantine = true;
      message = `CRITICAL: CLR Density drop (${clrVariance}) exceeds -2.0 limit (Specific gravity dilution detected). Batch auto-quarantined.`;
    } else if (volumeVariancePercent < -1.0) {
      // Transit leakage or physical theft
      status = 'FLAGGED_FOR_LEAKAGE';
      message = `WARNING: Mass-balance variance (${volumeVariancePercent}%) indicates transit loss/leakage exceeding -1.0%. Discrepancy logged for physical audit.`;
    }

    const reconciliationData = {
      receivedVolume: vFactory,
      receivedFat: Number(receivedFat) || batch.dispatchedWeightedFat,
      receivedSnf: Number(receivedSnf) || batch.dispatchedWeightedSnf,
      receivedClr: clrFactory,
      volumeVariancePercent,
      clrVariance,
      reconciledAt: new Date(),
      qcOfficerId: qcOfficerId || 'QC-OFFICER-88',
      status
    };

    batch.status = status;
    batch.reconciliationData = reconciliationData;

    const io = req.app.get('socketio');
    if (io) {
      if (isQuarantine) {
        const alertData = {
          alertId: `ALT-QC-${Date.now()}`,
          type: 'FACTORY_BATCH_QUARANTINED',
          severity: 'CRITICAL',
          centerId: batch.centerId,
          batchId: batch.batchId,
          tankerNumber: batch.tankerNumber,
          message: `[AUTO-QUARANTINE TRIGGERED] ${message}`,
          details: {
            batchId: batch.batchId,
            dispatchedVolume: vManifest,
            receivedVolume: vFactory,
            variancePercent: volumeVariancePercent,
            tankerNumber: batch.tankerNumber,
            driver: batch.driverName
          },
          timestamp: new Date()
        };
        store.alerts.unshift(alertData);
        io.emit('batch-quarantined', alertData);
      } else {
        io.emit('batch-reconciled', { batch, reconciliationData });
      }
    }

    // Return response matching PRD Section 7.3 format
    res.status(200).json({
      success: true,
      status,
      variancePercent: volumeVariancePercent,
      clrVariance,
      message,
      reconciliationData,
      batch
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
