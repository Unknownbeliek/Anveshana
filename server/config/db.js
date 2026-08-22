const mongoose = require('mongoose');
const crypto = require('crypto');

// ─── In-Memory Storage Engine ───────────────────────────────────────────────
// Provides full resilience when MongoDB is unreachable (zero-config demo mode).
class InMemoryStore {
  constructor() {
    this.farmers = [];
    this.deposits = [];
    this.batches = [];
    this.alerts = [];
    this.users = [];
    this.initialized = false;
  }

  seedInitialData() {
    if (this.initialized) return;

    // 1. Seed Realistic Farmers with 12-digit Indian NDLM Ear Tags
    this.farmers = [
      {
        _id: '65f1a0111111111111111111',
        farmerCustomId: 'FRM-DEL-1049',
        name: 'Ramesh Kumar Yadav',
        phone: '+91 98765 43210',
        village: 'Alipur Village, Delhi North',
        upiId: 'ramesh.yadav@okhdfcbank',
        purityScore: 94.5,
        purityGrade: 'A+',
        baseCapacity: 24,
        dynamicCapacity: 24,
        seasonalMultiplier: 1.0,
        cattle: [
          { earTagId: '100482910384', type: 'Cow', breed: 'Gir', baseDailyYield: 12, isLactating: true },
          { earTagId: '100482910385', type: 'Cow', breed: 'Gir', baseDailyYield: 12, isLactating: true }
        ],
        createdAt: new Date('2026-01-15T06:00:00.000Z')
      },
      {
        _id: '65f1a0222222222222222222',
        farmerCustomId: 'FRM-DEL-2088',
        name: 'Sunita Devi',
        phone: '+91 98112 34567',
        village: 'Bawana Dairy Cluster, Delhi',
        upiId: 'sunitadevi@icici',
        purityScore: 88.0,
        purityGrade: 'A',
        baseCapacity: 40,
        dynamicCapacity: 40,
        seasonalMultiplier: 1.0,
        cattle: [
          { earTagId: '100938475612', type: 'Buffalo', breed: 'Murrah', baseDailyYield: 14, isLactating: true },
          { earTagId: '100938475613', type: 'Buffalo', breed: 'Murrah', baseDailyYield: 14, isLactating: true },
          { earTagId: '100938475614', type: 'Cow', breed: 'Sahiwal', baseDailyYield: 12, isLactating: false }
        ],
        createdAt: new Date('2026-02-01T08:30:00.000Z')
      },
      {
        _id: '65f1a0333333333333333333',
        farmerCustomId: 'FRM-DEL-3012',
        name: 'Harpreet Singh',
        phone: '+91 97123 45678',
        village: 'Narela Mandi Cluster, Delhi',
        upiId: 'harpreet.singh@axl',
        purityScore: 78.2,
        purityGrade: 'B',
        baseCapacity: 44,
        dynamicCapacity: 44,
        seasonalMultiplier: 1.0,
        cattle: [
          { earTagId: '200119823471', type: 'Cow', breed: 'Holstein Friesian Cross', baseDailyYield: 22, isLactating: true },
          { earTagId: '200119823472', type: 'Cow', breed: 'Jersey Cross', baseDailyYield: 22, isLactating: true }
        ],
        createdAt: new Date('2026-02-10T10:15:00.000Z')
      }
    ];

    // 2. Seed Milk Deposits with Cryptographic SHA-256 Receipts
    this.deposits = [
      {
        _id: '65f2b0111111111111111111',
        depositId: 'DEP-1771651200001',
        farmerId: this.farmers[0]._id,
        farmerCustomId: 'FRM-DEL-1049',
        farmerName: 'Ramesh Kumar Yadav',
        centerId: 'CENT-EAST-04',
        volumeLiters: 19.5,
        qualityMetrics: { fat: 4.3, snf: 8.7, clrDensity: 29.5 },
        calculatedPayout: 878.6,
        biologicalDrift: { fatSnfRatio: 0.494, driftFlag: false, driftSeverity: 'NONE' },
        isFlagged: false,
        flagReason: null,
        receiptHash: 'a718b2c4e9f0182346781293aeb4829103847561a2b3c4d5e6f7a8b9c0d1e2f3',
        syncSource: 'DIRECT_ONLINE',
        timestamp: new Date('2026-08-20T06:30:00.000Z')
      },
      {
        _id: '65f2b0222222222222222222',
        depositId: 'DEP-1771651200002',
        farmerId: this.farmers[1]._id,
        farmerCustomId: 'FRM-DEL-2088',
        farmerName: 'Sunita Devi',
        centerId: 'CENT-NORTH-02',
        volumeLiters: 26.0,
        qualityMetrics: { fat: 6.8, snf: 9.1, clrDensity: 30.8 },
        calculatedPayout: 1912.4,
        biologicalDrift: { fatSnfRatio: 0.747, driftFlag: false, driftSeverity: 'NONE' },
        isFlagged: false,
        flagReason: null,
        receiptHash: 'c4e9f0182346781293aeb4829103847561a2b3c4d5e6f7a8b9c0d1e2f3a718b2',
        syncSource: 'DIRECT_ONLINE',
        timestamp: new Date('2026-08-20T07:15:00.000Z')
      }
    ];

    // 3. Seed Batch Manifests
    this.batches = [
      {
        _id: '65f3c0111111111111111111',
        batchId: 'BATCH-DEL-20260821-01',
        centerId: 'CENT-EAST-04',
        centerName: 'East Delhi Aggregation Hub 04',
        depositIds: [this.deposits[0]._id],
        dispatchedVolume: 5000.0,
        dispatchedWeightedFat: 4.25,
        dispatchedWeightedSnf: 8.65,
        dispatchedClr: 29.2,
        status: 'DISPATCHED',
        tankerNumber: 'DL-1GB-8842',
        driverName: 'Baldev Singh (Ph: +91 98990 11223)',
        reconciliationData: null,
        manifestHash: 'e4d3c2b1a09876543210fedcba9876543210abcdef0123456789abcdef012345',
        createdAt: new Date('2026-08-21T05:30:00.000Z')
      },
      {
        _id: '65f3c0222222222222222222',
        batchId: 'BATCH-DEL-20260820-02',
        centerId: 'CENT-NORTH-02',
        centerName: 'North Delhi Aggregation Hub 02',
        depositIds: [this.deposits[1]._id],
        dispatchedVolume: 4200.0,
        dispatchedWeightedFat: 5.1,
        dispatchedWeightedSnf: 8.8,
        dispatchedClr: 30.0,
        status: 'VERIFIED_AT_FACTORY',
        tankerNumber: 'DL-1GB-4190',
        driverName: 'Joginder Rawat',
        reconciliationData: {
          receivedVolume: 4185.0,
          receivedFat: 5.08,
          receivedSnf: 8.79,
          receivedClr: 29.8,
          volumeVariancePercent: -0.36,
          reconciledAt: new Date('2026-08-20T11:45:00.000Z'),
          qcOfficerId: 'QC-OFFICER-88'
        },
        manifestHash: 'b1a09876543210fedcba9876543210abcdef0123456789abcdef012345e4d3c2',
        createdAt: new Date('2026-08-20T08:00:00.000Z')
      }
    ];

    // 4. Seed Alert Logs
    this.alerts = [
      {
        _id: '65f4d0111111111111111111',
        alertId: 'ALT-20260820-001',
        type: 'TRANSIT_DENSITY_WARNING',
        severity: 'MEDIUM',
        centerId: 'CENT-NORTH-02',
        farmerCustomId: null,
        message: 'Minor temperature fluctuation detected on Tanker DL-1GB-4190 en-route to Central Silo.',
        metadata: { tanker: 'DL-1GB-4190', variance: '-0.36%' },
        timestamp: new Date('2026-08-20T10:12:00.000Z'),
        isResolved: true
      }
    ];

    // 5. Seed Demo Users
    this.users = [
      { _id: '65f5e0111111111111111111', loginId: 'FRM-DEL-1049', role: 'farmer', name: 'Ramesh Kumar Yadav', linkedFarmerId: 'FRM-DEL-1049', status: 'active' },
      { _id: '65f5e0222222222222222222', loginId: 'AGT-DEL-104', role: 'agent', name: 'Village Agent 104', linkedFarmerId: null, status: 'active' },
      { _id: '65f5e0222222222222222223', loginId: 'OPR-CENT-EAST-04', role: 'agent', name: 'East Delhi Aggregation Operator', linkedFarmerId: null, status: 'active' },
      { _id: '65f5e0333333333333333333', loginId: 'QC-DEL-088', role: 'factory', name: 'QC Officer 088', linkedFarmerId: null, status: 'active' },
      { _id: '65f5e0333333333333333334', loginId: 'OPR-SILO-MAIN-01', role: 'factory', name: 'Main Silo Plant Operator', linkedFarmerId: null, status: 'active' },
      { _id: '65f5e0444444444444444444', loginId: 'AUD-DEL-001', role: 'auditor', name: 'Auditor 001', linkedFarmerId: null, status: 'active' },
      { _id: '65f5e0444444444444444445', loginId: 'AUD-NCT-001', role: 'auditor', name: 'NCT District Safety Auditor', linkedFarmerId: null, status: 'active' }
    ];

    this.initialized = true;
    console.log('✅ In-Memory Seed Store initialized with Indian Dairy NDLM profiles.');
  }
}

const store = new InMemoryStore();
store.seedInitialData();

let isConnectedToMongo = false;

// ─── MongoDB Atlas Connection ────────────────────────────────────────────────
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('ℹ️  No MONGODB_URI set → running in resilient in-memory mode.');
    return;
  }

  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 30000
    });

    isConnectedToMongo = true;
    console.log('🚀 MongoDB Atlas connected. Cluster: Anveshana');

    // Ensure optimal indexes exist on startup
    await ensureIndexes();

    // Seed initial reference data if DB is empty
    await seedMongoData();

  } catch (err) {
    console.warn(`⚠️  MongoDB connection failed (${err.message}). Falling back to in-memory store.`);
    isConnectedToMongo = false;
  }
};

// ─── Index Verification ──────────────────────────────────────────────────────
const ensureIndexes = async () => {
  try {
    const Farmer = require('../models/Farmer');
    const MilkLog = require('../models/MilkLog');
    const Batch = require('../models/Batch');
    const AuditAlert = require('../models/AuditAlert');
    const User = require('../models/User');

    await Promise.all([
      Farmer.createIndexes(),
      MilkLog.createIndexes(),
      Batch.createIndexes(),
      AuditAlert.createIndexes(),
      User.createIndexes()
    ]);
    console.log('✅ MongoDB indexes verified and ensured.');
  } catch (err) {
    console.warn('⚠️  Index creation warning:', err.message);
  }
};

// ─── Seed MongoDB with Demo Data ─────────────────────────────────────────────
const seedMongoData = async () => {
  if (!isConnectedToMongo) return;
  const Farmer = require('../models/Farmer');
  const User = require('../models/User');

  // Seed Farmers
  const farmerCount = await Farmer.countDocuments();
  if (farmerCount === 0) {
    await Farmer.insertMany([
      {
        farmerCustomId: 'FRM-DEL-1049',
        name: 'Ramesh Kumar Yadav',
        phone: '+91 98765 43210',
        village: 'Alipur Village, Delhi North',
        upiId: 'ramesh.yadav@okhdfcbank',
        purityScore: 94.5, purityGrade: 'A+',
        baseCapacity: 24, dynamicCapacity: 24,
        cattle: [
          { earTagId: '100482910384', type: 'Cow', breed: 'Gir', baseDailyYield: 12, isLactating: true },
          { earTagId: '100482910385', type: 'Cow', breed: 'Gir', baseDailyYield: 12, isLactating: true }
        ]
      },
      {
        farmerCustomId: 'FRM-DEL-2088',
        name: 'Sunita Devi',
        phone: '+91 98112 34567',
        village: 'Bawana Dairy Cluster, Delhi',
        upiId: 'sunitadevi@icici',
        purityScore: 88.0, purityGrade: 'A',
        baseCapacity: 40, dynamicCapacity: 40,
        cattle: [
          { earTagId: '100938475612', type: 'Buffalo', breed: 'Murrah', baseDailyYield: 14, isLactating: true },
          { earTagId: '100938475613', type: 'Buffalo', breed: 'Murrah', baseDailyYield: 14, isLactating: true },
          { earTagId: '100938475614', type: 'Cow', breed: 'Sahiwal', baseDailyYield: 12, isLactating: false }
        ]
      },
      {
        farmerCustomId: 'FRM-DEL-3012',
        name: 'Harpreet Singh',
        phone: '+91 97123 45678',
        village: 'Narela Mandi Cluster, Delhi',
        upiId: 'harpreet.singh@axl',
        purityScore: 78.2, purityGrade: 'B',
        baseCapacity: 44, dynamicCapacity: 44,
        cattle: [
          { earTagId: '200119823471', type: 'Cow', breed: 'Holstein Friesian Cross', baseDailyYield: 22, isLactating: true },
          { earTagId: '200119823472', type: 'Cow', breed: 'Jersey Cross', baseDailyYield: 22, isLactating: true }
        ]
      }
    ]);
    console.log('✅ Seeded 3 demo farmers into MongoDB.');
  }

  // Seed Users
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const defaultPassword = process.env.DEMO_DEFAULT_PASSWORD || 'demo';
    const passwordHash = crypto.createHash('sha256').update(defaultPassword + '_anveshana_salt').digest('hex');

    await User.insertMany([
      { loginId: 'FRM-DEL-1049', role: 'farmer', name: 'Ramesh Kumar Yadav', linkedFarmerId: 'FRM-DEL-1049', passwordHash, status: 'active' },
      { loginId: 'AGT-DEL-104', role: 'agent', name: 'Village Agent 104', passwordHash, status: 'active' },
      { loginId: 'OPR-CENT-EAST-04', role: 'agent', name: 'East Delhi Operator', passwordHash, status: 'active' },
      { loginId: 'QC-DEL-088', role: 'factory', name: 'QC Officer 088', passwordHash, status: 'active' },
      { loginId: 'OPR-SILO-MAIN-01', role: 'factory', name: 'Main Silo Operator', passwordHash, status: 'active' },
      { loginId: 'AUD-DEL-001', role: 'auditor', name: 'District Auditor 001', passwordHash, status: 'active' },
      { loginId: 'AUD-NCT-001', role: 'auditor', name: 'NCT Safety Auditor', passwordHash, status: 'active' }
    ]);
    console.log('✅ Seeded 7 demo users into MongoDB (password: "demo").');
  }
};

module.exports = {
  connectDB,
  store,
  getIsConnectedToMongo: () => isConnectedToMongo
};
