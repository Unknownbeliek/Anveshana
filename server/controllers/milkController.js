const { store } = require('../config/db');
const { validateDeposit, calculatePayout, calculateDynamicCapacity } = require('../utils/yieldValidator');
const { generateReceiptHash } = require('../utils/cryptoHash');
const { calculatePurityScore } = require('../utils/purityRating');

exports.recordDeposit = async (req, res) => {
  try {
    const { farmerCustomId, centerId, volumeLiters, qualityMetrics, syncSource = 'DIRECT_ONLINE' } = req.body;

    if (!farmerCustomId || !volumeLiters || !qualityMetrics) {
      return res.status(400).json({
        success: false,
        message: 'farmerCustomId, volumeLiters, and qualityMetrics (fat, snf, clrDensity) are required.'
      });
    }

    const farmer = store.farmers.find(f => f.farmerCustomId === farmerCustomId);
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: `Farmer with ID ${farmerCustomId} not registered in NDLM registry.`
      });
    }

    // 1. Biological & Quality Validation
    const validationResult = validateDeposit({
      farmer,
      volumeLiters,
      qualityMetrics
    });

    // 2. Dynamic Payout Calculation
    const payoutResult = calculatePayout({
      volumeLiters,
      fat: qualityMetrics.fat,
      snf: qualityMetrics.snf,
      purityScore: farmer.purityScore
    });

    const timestamp = new Date();
    const depositId = `DEP-${Date.now()}`;

    // 3. Cryptographic SHA-256 Seal
    const receiptHash = generateReceiptHash({
      farmerCustomId: farmer.farmerCustomId,
      volumeLiters,
      calculatedPayout: payoutResult.totalPayout,
      timestamp
    });

    const newDeposit = {
      _id: `65f2b0${Date.now().toString(16).slice(-18)}`,
      depositId,
      farmerId: farmer._id,
      farmerCustomId: farmer.farmerCustomId,
      farmerName: farmer.name,
      centerId: centerId || 'CENT-EAST-04',
      volumeLiters: Number(volumeLiters),
      qualityMetrics: {
        fat: Number(qualityMetrics.fat),
        snf: Number(qualityMetrics.snf),
        clrDensity: Number(qualityMetrics.clrDensity)
      },
      calculatedPayout: payoutResult.totalPayout,
      payoutBreakdown: payoutResult,
      isFlagged: validationResult.isFlagged,
      flagReason: validationResult.primaryFlagReason,
      flags: validationResult.flags,
      receiptHash,
      syncSource,
      timestamp
    };

    store.deposits.unshift(newDeposit);

    // 4. Update Farmer's dynamic rolling purity score
    const farmerDeposits = store.deposits.filter(d => d.farmerCustomId === farmer.farmerCustomId);
    const recentFlagsCount = farmerDeposits.filter(d => d.isFlagged).length;
    const updatedPurity = calculatePurityScore({
      recentDeposits: farmerDeposits,
      cattleList: farmer.cattle,
      recentFlagsCount
    });
    farmer.purityScore = updatedPurity.score;

    // 5. Broadcast to Socket.io for Auditor and Live Dashboards (<100ms latency)
    const io = req.app.get('socketio');
    if (io) {
      // Broadcast general deposit event
      io.emit('deposit-recorded', {
        deposit: newDeposit,
        farmer: {
          name: farmer.name,
          farmerCustomId: farmer.farmerCustomId,
          village: farmer.village
        }
      });

      // If mathematical anomaly detected, broadcast high-priority ANOMALY ALERT to Auditor Command Room
      if (newDeposit.isFlagged) {
        const alertData = {
          alertId: `ALT-${Date.now()}`,
          type: 'CAPACITY_BREACH_ANOMALY',
          severity: 'CRITICAL',
          centerId: newDeposit.centerId,
          farmerCustomId: farmer.farmerCustomId,
          farmerName: farmer.name,
          village: farmer.village,
          message: newDeposit.flagReason,
          details: {
            enteredVolume: newDeposit.volumeLiters,
            maxAllowedCapacity: validationResult.dynamicCapacity,
            excessVolume: Number((newDeposit.volumeLiters - validationResult.dynamicCapacity).toFixed(2)),
            cattleCount: farmer.cattle.length,
            fat: newDeposit.qualityMetrics.fat,
            snf: newDeposit.qualityMetrics.snf,
            clr: newDeposit.qualityMetrics.clrDensity
          },
          timestamp: new Date(),
          isResolved: false
        };

        store.alerts.unshift(alertData);
        io.emit('anomaly-alert', alertData);
      }
    }

    // Return response matching PRD Section 7.1
    res.status(201).json({
      success: true,
      deposit: {
        depositId: newDeposit.depositId,
        volumeLiters: newDeposit.volumeLiters,
        calculatedPayout: newDeposit.calculatedPayout,
        isFlagged: newDeposit.isFlagged,
        flagReason: newDeposit.flagReason,
        receiptHash: newDeposit.receiptHash,
        timestamp: newDeposit.timestamp.toISOString(),
        qualityMetrics: newDeposit.qualityMetrics,
        farmerCustomId: newDeposit.farmerCustomId,
        farmerName: farmer.name,
        purityScore: farmer.purityScore
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncBatch = async (req, res) => {
  try {
    const { centerId, entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'entries array is required.' });
    }

    const processedIds = [];
    const io = req.app.get('socketio');

    for (const entry of entries) {
      const farmer = store.farmers.find(f => f.farmerCustomId === entry.farmerCustomId);
      if (!farmer) continue;

      const validationResult = validateDeposit({
        farmer,
        volumeLiters: entry.volumeLiters,
        qualityMetrics: entry.qualityMetrics
      });

      const payoutResult = calculatePayout({
        volumeLiters: entry.volumeLiters,
        fat: entry.qualityMetrics.fat,
        snf: entry.qualityMetrics.snf,
        purityScore: farmer.purityScore
      });

      const timestamp = entry.queuedAt ? new Date(entry.queuedAt) : new Date();
      const depositId = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const receiptHash = generateReceiptHash({
        farmerCustomId: farmer.farmerCustomId,
        volumeLiters: entry.volumeLiters,
        calculatedPayout: payoutResult.totalPayout,
        timestamp
      });

      const syncedDeposit = {
        _id: `65f2b0${Date.now().toString(16).slice(-18)}`,
        depositId,
        farmerId: farmer._id,
        farmerCustomId: farmer.farmerCustomId,
        farmerName: farmer.name,
        centerId: centerId || 'CENT-EAST-04',
        volumeLiters: Number(entry.volumeLiters),
        qualityMetrics: entry.qualityMetrics,
        calculatedPayout: payoutResult.totalPayout,
        isFlagged: validationResult.isFlagged,
        flagReason: validationResult.primaryFlagReason,
        receiptHash,
        syncSource: 'OFFLINE_BUFFER_SYNC',
        timestamp
      };

      store.deposits.unshift(syncedDeposit);
      processedIds.push(entry.clientTempId || depositId);

      if (io && syncedDeposit.isFlagged) {
        const alertData = {
          alertId: `ALT-${Date.now()}`,
          type: 'OFFLINE_SYNC_ANOMALY',
          severity: 'CRITICAL',
          centerId: syncedDeposit.centerId,
          farmerCustomId: farmer.farmerCustomId,
          farmerName: farmer.name,
          message: `[Synced Offline] ${syncedDeposit.flagReason}`,
          timestamp: new Date()
        };
        store.alerts.unshift(alertData);
        io.emit('anomaly-alert', alertData);
      }
    }

    if (io) {
      io.emit('offline-batch-synced', { centerId, syncedCount: processedIds.length });
    }

    // Return response matching PRD Section 7.2
    res.status(200).json({
      success: true,
      syncedCount: processedIds.length,
      processedIds
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFarmerDeposits = async (req, res) => {
  try {
    const { id } = req.params;
    const deposits = store.deposits.filter(d => d.farmerCustomId === id || d.farmerId === id);
    res.json({
      success: true,
      count: deposits.length,
      deposits
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecentDeposits = async (req, res) => {
  try {
    res.json({
      success: true,
      count: store.deposits.length,
      deposits: store.deposits.slice(0, 50)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
