const mongoose = require('mongoose');

const CattleSchema = new mongoose.Schema({
  earTagId: { type: String, required: true, match: /^\d{12}$/, comment: '12-digit Bharat Pashudhan NDLM standard' },
  type: { type: String, required: true, enum: ['Cow', 'Buffalo', 'Goat'] },
  breed: { type: String, required: true },
  baseDailyYield: { type: Number, required: true, min: 0 },
  isLactating: { type: Boolean, default: true }
}, { _id: false });

const FarmerSchema = new mongoose.Schema({
  farmerCustomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    match: /^FRM-[A-Z]{3}-\d{4}$/
  },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  village: { type: String, required: true },
  upiId: { type: String, default: null },

  cattle: { type: [CattleSchema], default: [] },

  // Computed fields - updated on each deposit
  purityScore: { type: Number, default: 100.0, min: 0, max: 100 },
  purityGrade: { type: String, default: 'A', enum: ['A+', 'A', 'B', 'C', 'D', 'SUSPENDED'] },
  dynamicCapacity: { type: Number, default: 0 },   // Sum of lactating cattle yield (with seasonal multiplier)
  baseCapacity: { type: Number, default: 0 },       // Raw sum without multiplier
  seasonalMultiplier: { type: Number, default: 1.0 },

  status: { type: String, default: 'active', enum: ['active', 'suspended', 'pending'] }
}, { timestamps: true });

// Virtual: real-time capacity from cattle array
FarmerSchema.virtual('computedCapacity').get(function () {
  return this.cattle
    .filter(c => c.isLactating)
    .reduce((sum, c) => sum + c.baseDailyYield, 0);
});

module.exports = mongoose.model('Farmer', FarmerSchema);
