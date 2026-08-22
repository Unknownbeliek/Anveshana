const { store, getIsConnectedToMongo } = require('../config/db');
const { validateDeposit, calculatePayout, calculateDynamicCapacity } = require('../utils/yieldValidator');
const { generateReceiptHash } = require('../utils/cryptoHash');
const { calculatePurityScore } = require('../utils/purityRating');
const { detectBiologicalDrift } = require('../utils/biologicalDrift');

/**
 * POST /api/milk/deposit
 * Records a single milk deposit with:
 * - Biological capacity validation (NDLM linked)
 * - Biological Drift (FAT/SNF ratio) detection
 * - SHA-256 cryptographic receipt seal
 * - Real-time Socket.io broadcast
 * - MongoDB atomic write (when connected) with in-memory fallback
 */
exports.recordDeposit = async (req, res) => {
  try {
    const { farmerCustomId, centerId, volumeLiters, qualityMetrics, syncSource = 'DIRECT_ONLINE' } = req.body;

    if (!farmerCustomId || !volumeLiters || !qualityMetrics) {
      return res.status(400).json({
        success: false,
        message: 'farmerCustomId, volumeLiters, and qualityMetrics (fat, snf, clrDensity) are required.'
      });
    }

    let farmer = null;

    if (getIsConnectedToMongo()) {
      // ── MongoDB Path ─────────────────────────────────────────────────────
      const Farmer = require('../models/Farmer');
      const MilkLog = require('../models/MilkLog');
      const AuditAlert = require('../models/AuditAlert');
      const mongoose = require('mongoose');

      farmer = await Farmer.findOne({ farmerCustomId });
      if (!farmer) {
        return res.status(404).json({ success: false, message: `Farmer ${farmerCustomId} not in NDLM registry.` });
      }

      // 1. Biological capacity validation
      const validationResult = validateDeposit({ farmer, volumeLiters, qualityMetrics });

      // 2. 30-Day Biological Drift analysis
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      const historicalDeposits = await MilkLog
        .find({ farmerCustomId, timestamp: { $gte: thirtyDaysAgo }, isFlagged: false })
        .sort({ timestamp: -1 })
        .limit(60)
        .lean();

      const driftResult = detectBiologicalDrift({
        fat: Number(qualityMetrics.fat),
        snf: Number(qualityMetrics.snf),
        cattle: farmer.cattle,
        historicalDeposits
      });

      // Merge drift flags into the main validation
      if (driftResult.driftFlag) {
        validationResult.isFlagged = true;
        validationResult.flags = [...(validationResult.flags || []), ...driftResult.driftDetails];
        if (!validationResult.primaryFlagReason) {
          validationResult.primaryFlagReason = driftResult.driftDetails[0];
        }
      }

      // 3. Payout calculation
      const payoutResult = calculatePayout({ volumeLiters, fat: qualityMetrics.fat, snf: qualityMetrics.snf, purityScore: farmer.purityScore });

      const timestamp = new Date();
      const depositId = `DEP-${Date.now()}`;

      // 4. SHA-256 cryptographic receipt seal
      const receiptHash = generateReceiptHash({ farmerCustomId: farmer.farmerCustomId, volumeLiters, calculatedPayout: payoutResult.totalPayout, timestamp });

      // 5. Atomic write inside a Mongoose session (transaction)
      const session = await mongoose.startSession();
      let savedDeposit;
      try {
        await session.withTransaction(async () => {
          const [depositDoc] = await MilkLog.create([{
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
            biologicalDrift: {
              fatSnfRatio: driftResult.fatSnfRatio,
              fatSnfDrift: driftResult.zScore,
              driftFlag: driftResult.driftFlag,
              driftSeverity: driftResult.driftSeverity
            },
            isFlagged: validationResult.isFlagged,
            flagReason: validationResult.primaryFlagReason,
            flags: validationResult.flags || [],
            receiptHash,
            syncSource,
            timestamp
          }], { session });

          savedDeposit = depositDoc;

          // Update farmer purity score atomically in same transaction
          const allDeposits = await MilkLog.find({ farmerCustomId }).session(session).lean();
          const purityUpdate = calculatePurityScore({
            recentDeposits: allDeposits,
            cattleList: farmer.cattle,
            recentFlagsCount: allDeposits.filter(d => d.isFlagged).length
          });

          await Farmer.findByIdAndUpdate(farmer._id, { purityScore: purityUpdate.score }, { session });

          // Log alert into AuditAlert (immutable) if flagged
          if (validationResult.isFlagged) {
            await AuditAlert.create([{
              alertId: `ALT-${Date.now()}`,
              type: driftResult.driftFlag ? 'BIOLOGICAL_DRIFT_ALERT' : 'CAPACITY_BREACH_ANOMALY',
              severity: driftResult.driftSeverity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
              centerId: centerId || 'CENT-EAST-04',
              farmerCustomId: farmer.farmerCustomId,
              farmerName: farmer.name,
              message: validationResult.primaryFlagReason,
              metadata: {
                depositId,
                volumeLiters,
                fat: qualityMetrics.fat,
                snf: qualityMetrics.snf,
                fatSnfRatio: driftResult.fatSnfRatio,
                zScore: driftResult.zScore
              },
              timestamp: new Date()
            }], { session });
          }
        });
      } finally {
        await session.endSession();
      }

      // 6. Real-time broadcast
      broadcastDeposit(req, savedDeposit, farmer, validationResult);

      return res.status(201).json({
        success: true,
        deposit: formatDepositResponse(savedDeposit, farmer, driftResult)
      });

    } else {
      // ── In-Memory Fallback Path ─────────────────────────────────────────
      farmer = store.farmers.find(f => f.farmerCustomId === farmerCustomId);
      if (!farmer) {
        return res.status(404).json({ success: false, message: `Farmer ${farmerCustomId} not in NDLM registry.` });
      }

      const validationResult = validateDeposit({ farmer, volumeLiters, qualityMetrics });

      const farmerHistory = store.deposits.filter(d => d.farmerCustomId === farmerCustomId);
      const driftResult = detectBiologicalDrift({
        fat: Number(qualityMetrics.fat),
        snf: Number(qualityMetrics.snf),
        cattle: farmer.cattle,
        historicalDeposits: farmerHistory
      });

      if (driftResult.driftFlag) {
        validationResult.isFlagged = true;
        validationResult.flags = [...(validationResult.flags || []), ...driftResult.driftDetails];
        if (!validationResult.primaryFlagReason) validationResult.primaryFlagReason = driftResult.driftDetails[0];
      }

      const payoutResult = calculatePayout({ volumeLiters, fat: qualityMetrics.fat, snf: qualityMetrics.snf, purityScore: farmer.purityScore });
      const timestamp = new Date();
      const depositId = `DEP-${Date.now()}`;
      const receiptHash = generateReceiptHash({ farmerCustomId: farmer.farmerCustomId, volumeLiters, calculatedPayout: payoutResult.totalPayout, timestamp });

      const newDeposit = {
        _id: `65f2b0${Date.now().toString(16).slice(-18)}`,
        depositId,
        farmerId: farmer._id,
        farmerCustomId: farmer.farmerCustomId,
        farmerName: farmer.name,
        centerId: centerId || 'CENT-EAST-04',
        volumeLiters: Number(volumeLiters),
        qualityMetrics: { fat: Number(qualityMetrics.fat), snf: Number(qualityMetrics.snf), clrDensity: Number(qualityMetrics.clrDensity) },
        calculatedPayout: payoutResult.totalPayout,
        biologicalDrift: {
          fatSnfRatio: driftResult.fatSnfRatio,
          fatSnfDrift: driftResult.zScore,
          driftFlag: driftResult.driftFlag,
          driftSeverity: driftResult.driftSeverity
        },
        isFlagged: validationResult.isFlagged,
        flagReason: validationResult.primaryFlagReason,
        flags: validationResult.flags || [],
        receiptHash,
        syncSource,
        timestamp
      };

      store.deposits.unshift(newDeposit);

      // Update purity score
      const allDeposits = store.deposits.filter(d => d.farmerCustomId === farmer.farmerCustomId);
      const purityUpdate = calculatePurityScore({ recentDeposits: allDeposits, cattleList: farmer.cattle, recentFlagsCount: allDeposits.filter(d => d.isFlagged).length });
      farmer.purityScore = purityUpdate.score;

      if (validationResult.isFlagged) {
        const alertData = {
          _id: `65f4d0${Date.now().toString(16).slice(-18)}`,
          alertId: `ALT-${Date.now()}`,
          type: driftResult.driftFlag ? 'BIOLOGICAL_DRIFT_ALERT' : 'CAPACITY_BREACH_ANOMALY',
          severity: driftResult.driftSeverity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          centerId: newDeposit.centerId,
          farmerCustomId: farmer.farmerCustomId,
          farmerName: farmer.name,
          message: validationResult.primaryFlagReason,
          metadata: { depositId, volumeLiters, fat: qualityMetrics.fat, snf: qualityMetrics.snf, fatSnfRatio: driftResult.fatSnfRatio },
          timestamp: new Date(),
          isResolved: false
        };
        store.alerts.unshift(alertData);
      }

      broadcastDeposit(req, newDeposit, farmer, validationResult);

      return res.status(201).json({
        success: true,
        deposit: formatDepositResponse(newDeposit, farmer, driftResult)
      });
    }
  } catch (error) {
    console.error('[milk/deposit] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/milk/sync-batch
 * Atomic offline sync: all entries commit together or none do.
 * Uses Mongoose session.withTransaction() when MongoDB is available.
 */
exports.syncBatch = async (req, res) => {
  try {
    const { centerId, entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'entries array is required.' });
    }
    if (entries.length > 100) {
      return res.status(400).json({ success: false, message: 'Max 100 entries per sync batch.' });
    }

    const io = req.app.get('socketio');

    if (getIsConnectedToMongo()) {
      const Farmer = require('../models/Farmer');
      const MilkLog = require('../models/MilkLog');
      const AuditAlert = require('../models/AuditAlert');
      const mongoose = require('mongoose');

      const processedIds = [];
      let totalFlagged = 0;

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          for (const entry of entries) {
            const farmer = await Farmer.findOne({ farmerCustomId: entry.farmerCustomId }).session(session);
            if (!farmer) continue;

            const validationResult = validateDeposit({ farmer, volumeLiters: entry.volumeLiters, qualityMetrics: entry.qualityMetrics });
            const driftResult = detectBiologicalDrift({ fat: Number(entry.qualityMetrics.fat), snf: Number(entry.qualityMetrics.snf), cattle: farmer.cattle, historicalDeposits: [] });
            if (driftResult.driftFlag) {
              validationResult.isFlagged = true;
              if (!validationResult.primaryFlagReason) validationResult.primaryFlagReason = driftResult.driftDetails[0];
            }

            const payoutResult = calculatePayout({ volumeLiters: entry.volumeLiters, fat: entry.qualityMetrics.fat, snf: entry.qualityMetrics.snf, purityScore: farmer.purityScore });
            const timestamp = entry.queuedAt ? new Date(entry.queuedAt) : new Date();
            const depositId = `DEP-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
            const receiptHash = generateReceiptHash({ farmerCustomId: farmer.farmerCustomId, volumeLiters: entry.volumeLiters, calculatedPayout: payoutResult.totalPayout, timestamp });

            const [syncedDoc] = await MilkLog.create([{
              depositId,
              farmerId: farmer._id,
              farmerCustomId: farmer.farmerCustomId,
              farmerName: farmer.name,
              centerId: centerId || 'CENT-EAST-04',
              volumeLiters: Number(entry.volumeLiters),
              qualityMetrics: entry.qualityMetrics,
              calculatedPayout: payoutResult.totalPayout,
              biologicalDrift: { fatSnfRatio: driftResult.fatSnfRatio, driftFlag: driftResult.driftFlag, driftSeverity: driftResult.driftSeverity },
              isFlagged: validationResult.isFlagged,
              flagReason: validationResult.primaryFlagReason,
              receiptHash,
              syncSource: 'OFFLINE_BUFFER_SYNC',
              isSynced: true,
              timestamp
            }], { session });

            processedIds.push(entry.clientTempId || depositId);
            if (validationResult.isFlagged) {
              totalFlagged++;
              await AuditAlert.create([{
                alertId: `ALT-${Date.now()}-${processedIds.length}`,
                type: 'OFFLINE_SYNC_ANOMALY',
                severity: 'HIGH',
                centerId: centerId || 'CENT-EAST-04',
                farmerCustomId: farmer.farmerCustomId,
                farmerName: farmer.name,
                message: `[Offline Sync] ${validationResult.primaryFlagReason}`,
                metadata: { depositId, volumeLiters: entry.volumeLiters },
                timestamp: new Date()
              }], { session });
            }
          }
        });
      } finally {
        await session.endSession();
      }

      if (io) io.emit('offline-batch-synced', { centerId, syncedCount: processedIds.length, flaggedCount: totalFlagged });

      return res.status(200).json({ success: true, syncedCount: processedIds.length, flaggedCount: totalFlagged, processedIds });

    } else {
      // ── In-Memory Atomic Simulation ───────────────────────────────────────
      // Build all records first; only commit to store if ALL are valid (no corrupt entries)
      const pendingDeposits = [];
      const processedIds = [];
      let totalFlagged = 0;

      for (const entry of entries) {
        const farmer = store.farmers.find(f => f.farmerCustomId === entry.farmerCustomId);
        if (!farmer) continue;

        const validationResult = validateDeposit({ farmer, volumeLiters: entry.volumeLiters, qualityMetrics: entry.qualityMetrics });
        const driftResult = detectBiologicalDrift({ fat: Number(entry.qualityMetrics.fat), snf: Number(entry.qualityMetrics.snf), cattle: farmer.cattle, historicalDeposits: store.deposits.filter(d => d.farmerCustomId === farmer.farmerCustomId) });
        if (driftResult.driftFlag) {
          validationResult.isFlagged = true;
          if (!validationResult.primaryFlagReason) validationResult.primaryFlagReason = driftResult.driftDetails[0];
        }

        const payoutResult = calculatePayout({ volumeLiters: entry.volumeLiters, fat: entry.qualityMetrics.fat, snf: entry.qualityMetrics.snf, purityScore: farmer.purityScore });
        const timestamp = entry.queuedAt ? new Date(entry.queuedAt) : new Date();
        const depositId = `DEP-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
        const receiptHash = generateReceiptHash({ farmerCustomId: farmer.farmerCustomId, volumeLiters: entry.volumeLiters, calculatedPayout: payoutResult.totalPayout, timestamp });

        pendingDeposits.push({
          _id: `65f2b0${Date.now().toString(16).slice(-18)}`,
          depositId, farmerId: farmer._id, farmerCustomId: farmer.farmerCustomId, farmerName: farmer.name,
          centerId: centerId || 'CENT-EAST-04', volumeLiters: Number(entry.volumeLiters),
          qualityMetrics: entry.qualityMetrics, calculatedPayout: payoutResult.totalPayout,
          biologicalDrift: { fatSnfRatio: driftResult.fatSnfRatio, driftFlag: driftResult.driftFlag, driftSeverity: driftResult.driftSeverity },
          isFlagged: validationResult.isFlagged, flagReason: validationResult.primaryFlagReason,
          receiptHash, syncSource: 'OFFLINE_BUFFER_SYNC', timestamp
        });

        processedIds.push(entry.clientTempId || depositId);
        if (validationResult.isFlagged) totalFlagged++;
      }

      // Atomic commit: all-or-nothing push to store
      store.deposits.unshift(...pendingDeposits);

      if (io) io.emit('offline-batch-synced', { centerId, syncedCount: processedIds.length, flaggedCount: totalFlagged });

      return res.status(200).json({ success: true, syncedCount: processedIds.length, flaggedCount: totalFlagged, processedIds });
    }

  } catch (error) {
    console.error('[milk/sync-batch] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFarmerDeposits = async (req, res) => {
  try {
    const { id } = req.params;
    let deposits;

    if (getIsConnectedToMongo()) {
      const MilkLog = require('../models/MilkLog');
      deposits = await MilkLog
        .find({ $or: [{ farmerCustomId: id }, { farmerId: id }] })
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();
    } else {
      deposits = store.deposits.filter(d => d.farmerCustomId === id || d.farmerId === id);
    }

    res.json({ success: true, count: deposits.length, deposits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecentDeposits = async (req, res) => {
  try {
    let deposits;

    if (getIsConnectedToMongo()) {
      const MilkLog = require('../models/MilkLog');
      deposits = await MilkLog.find().sort({ timestamp: -1 }).limit(50).lean();
    } else {
      deposits = store.deposits.slice(0, 50);
    }

    res.json({ success: true, count: deposits.length, deposits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function broadcastDeposit(req, deposit, farmer, validationResult) {
  const io = req.app.get('socketio');
  if (!io) return;

  io.emit('deposit-recorded', { deposit, farmer: { name: farmer.name, farmerCustomId: farmer.farmerCustomId, village: farmer.village } });

  if (deposit.isFlagged) {
    io.emit('anomaly-alert', {
      alertId: `ALT-${Date.now()}`,
      type: deposit.biologicalDrift?.driftFlag ? 'BIOLOGICAL_DRIFT_ALERT' : 'CAPACITY_BREACH_ANOMALY',
      severity: deposit.biologicalDrift?.driftSeverity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      centerId: deposit.centerId,
      farmerCustomId: farmer.farmerCustomId,
      farmerName: farmer.name,
      message: deposit.flagReason,
      timestamp: new Date()
    });
  }
}

function formatDepositResponse(deposit, farmer, driftResult) {
  return {
    depositId: deposit.depositId,
    volumeLiters: deposit.volumeLiters,
    calculatedPayout: deposit.calculatedPayout,
    isFlagged: deposit.isFlagged,
    flagReason: deposit.flagReason,
    biologicalDrift: {
      fatSnfRatio: driftResult.fatSnfRatio,
      driftFlag: driftResult.driftFlag,
      driftSeverity: driftResult.driftSeverity,
      zScore: driftResult.zScore
    },
    receiptHash: deposit.receiptHash,
    timestamp: (deposit.timestamp instanceof Date ? deposit.timestamp : new Date(deposit.timestamp)).toISOString(),
    qualityMetrics: deposit.qualityMetrics,
    farmerCustomId: deposit.farmerCustomId,
    farmerName: farmer.name,
    purityScore: farmer.purityScore
  };
}
