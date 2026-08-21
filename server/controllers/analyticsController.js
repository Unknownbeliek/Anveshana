const { store } = require('../config/db');
const { calculateDynamicCapacity } = require('../utils/yieldValidator');
const { verifyReceiptHash } = require('../utils/cryptoHash');

exports.getDistrictAnalytics = async (req, res) => {
  try {
    // 1. Calculate District Livestock Biological Capacity
    let totalRegisteredCattle = 0;
    let totalDailyBiologicalCapacity = 0;
    let lactatingCattleCount = 0;

    store.farmers.forEach(farmer => {
      const { dynamicCapacity } = calculateDynamicCapacity(farmer.cattle);
      totalDailyBiologicalCapacity += dynamicCapacity;
      totalRegisteredCattle += farmer.cattle.length;
      lactatingCattleCount += farmer.cattle.filter(c => c.isLactating !== false).length;
    });

    // 2. Calculate Today's Procurement Metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalVolumeProcured = 0;
    let totalPayoutsDisbursed = 0;
    let flaggedDepositsCount = 0;
    let totalDepositsCount = store.deposits.length;

    store.deposits.forEach(d => {
      totalVolumeProcured += Number(d.volumeLiters) || 0;
      totalPayoutsDisbursed += Number(d.calculatedPayout) || 0;
      if (d.isFlagged) flaggedDepositsCount++;
    });

    // 3. District Network Nodes for Interactive GIS Map
    const nodes = [
      {
        id: 'SILO-MAIN-01',
        name: 'Central Dairy Silo & Chilling Terminal',
        type: 'PROCESSING_PLANT',
        lat: 28.7041,
        lng: 77.1025,
        status: store.batches.some(b => b.status === 'QUARANTINED') ? 'QUARANTINE_ALERT' : 'OPERATIONAL',
        capacityLiters: 50000,
        currentStockLiters: 28450,
        address: 'G.T. Karnal Road Industrial Complex, Delhi'
      },
      {
        id: 'CENT-EAST-04',
        name: 'East Delhi Aggregation Hub 04',
        type: 'COLLECTION_CENTER',
        lat: 28.6280,
        lng: 77.2789,
        status: store.deposits.some(d => d.centerId === 'CENT-EAST-04' && d.isFlagged) ? 'ANOMALY_DETECTED' : 'HEALTHY',
        dailyIntakeLiters: 5420,
        registeredFarmers: 42,
        address: 'Anand Vihar Co-op Zone, Delhi East'
      },
      {
        id: 'CENT-NORTH-02',
        name: 'North Delhi Aggregation Hub 02',
        type: 'COLLECTION_CENTER',
        lat: 28.7890,
        lng: 77.1230,
        status: store.deposits.some(d => d.centerId === 'CENT-NORTH-02' && d.isFlagged) ? 'ANOMALY_DETECTED' : 'HEALTHY',
        dailyIntakeLiters: 4890,
        registeredFarmers: 38,
        address: 'Alipur Block Village Center, Delhi North'
      },
      {
        id: 'CENT-WEST-01',
        name: 'West Delhi Collection Post 01',
        type: 'COLLECTION_CENTER',
        lat: 28.6500,
        lng: 77.0500,
        status: 'HEALTHY',
        dailyIntakeLiters: 3150,
        registeredFarmers: 29,
        address: 'Najafgarh Dairy Belt, Delhi West'
      },
      {
        id: 'FARM-NODE-1049',
        name: 'Ramesh Yadav Farm (2 Gir Cows)',
        type: 'NDLM_FARM_NODE',
        lat: 28.7950,
        lng: 77.1350,
        farmerCustomId: 'FRM-DEL-1049',
        status: store.deposits.some(d => d.farmerCustomId === 'FRM-DEL-1049' && d.isFlagged) ? 'BREACH_CRITICAL' : 'VERIFIED_OPTIMAL',
        capacityMax: 24.0,
        purityScore: store.farmers.find(f => f.farmerCustomId === 'FRM-DEL-1049')?.purityScore || 94.5
      }
    ];

    // 4. Transit Hash Chains
    const transitChains = store.batches.map(b => ({
      batchId: b.batchId,
      fromNode: b.centerId,
      toNode: 'SILO-MAIN-01',
      status: b.status,
      dispatchedVolume: b.dispatchedVolume,
      variancePercent: b.reconciliationData?.volumeVariancePercent || 0,
      tankerNumber: b.tankerNumber
    }));

    // 5. 7-Day Procurement vs Biological Limit Series
    const trendData = [
      { day: 'Mon', intake: 11200, biologicalLimit: 14500, anomalies: 0 },
      { day: 'Tue', intake: 12400, biologicalLimit: 14500, anomalies: 1 },
      { day: 'Wed', intake: 11800, biologicalLimit: 14500, anomalies: 0 },
      { day: 'Thu', intake: 13100, biologicalLimit: 14500, anomalies: 0 },
      { day: 'Fri', intake: 14200, biologicalLimit: 14500, anomalies: 2 },
      { day: 'Sat', intake: 12900, biologicalLimit: 14500, anomalies: 0 },
      { day: 'Sun (Today)', intake: totalVolumeProcured || 13500, biologicalLimit: totalDailyBiologicalCapacity || 14500, anomalies: flaggedDepositsCount }
    ];

    res.json({
      success: true,
      summary: {
        totalDailyBiologicalCapacity: Number(totalDailyBiologicalCapacity.toFixed(1)),
        totalVolumeProcured: Number(totalVolumeProcured.toFixed(1)),
        capacityUtilizationPercent: totalDailyBiologicalCapacity > 0 ? Number(((totalVolumeProcured / totalDailyBiologicalCapacity) * 100).toFixed(1)) : 0,
        totalPayoutsDisbursed: Number(totalPayoutsDisbursed.toFixed(2)),
        totalRegisteredCattle,
        lactatingCattleCount,
        registeredFarmersCount: store.farmers.length,
        totalDepositsCount,
        flaggedDepositsCount,
        quarantinedBatchesCount: store.batches.filter(b => b.status === 'QUARANTINED').length
      },
      nodes,
      transitChains,
      trendData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    res.json({
      success: true,
      count: store.alerts.length,
      alerts: store.alerts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyReceipt = async (req, res) => {
  try {
    const { receiptHash, farmerCustomId, volumeLiters, calculatedPayout, timestamp } = req.body;
    
    const isValid = verifyReceiptHash({
      receiptHash,
      farmerCustomId,
      volumeLiters,
      calculatedPayout,
      timestamp
    });

    res.json({
      success: true,
      isValid,
      message: isValid
        ? '✅ Cryptographic SHA-256 Seal VERIFIED. Receipt integrity mathematically guaranteed.'
        : '❌ Cryptographic Seal MISMATCH. Potential data tampering detected!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
