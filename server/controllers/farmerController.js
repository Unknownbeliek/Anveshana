const { store } = require('../config/db');
const { calculateDynamicCapacity } = require('../utils/yieldValidator');
const { calculatePurityScore } = require('../utils/purityRating');

exports.getAllFarmers = async (req, res) => {
  try {
    const farmersWithMetrics = store.farmers.map(farmer => {
      const { dynamicCapacity, baseSum } = calculateDynamicCapacity(farmer.cattle);
      const farmerDeposits = store.deposits.filter(d => d.farmerCustomId === farmer.farmerCustomId);
      const recentFlags = farmerDeposits.filter(d => d.isFlagged).length;
      const purity = calculatePurityScore({
        recentDeposits: farmerDeposits,
        cattleList: farmer.cattle,
        recentFlagsCount: recentFlags
      });

      return {
        ...farmer,
        dynamicCapacity,
        baseCapacity: baseSum,
        purityScore: purity.score,
        purityGrade: purity.grade,
        purityDetails: purity
      };
    });

    res.json({
      success: true,
      count: farmersWithMetrics.length,
      farmers: farmersWithMetrics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFarmerById = async (req, res) => {
  try {
    const { id } = req.params;
    const farmer = store.farmers.find(f => f.farmerCustomId === id || f._id === id);

    if (!farmer) {
      return res.status(404).json({ success: false, message: `Farmer not found with ID ${id}` });
    }

    const { dynamicCapacity, baseSum, multiplier } = calculateDynamicCapacity(farmer.cattle);
    const farmerDeposits = store.deposits.filter(d => d.farmerCustomId === farmer.farmerCustomId);
    const recentFlags = farmerDeposits.filter(d => d.isFlagged).length;
    const purity = calculatePurityScore({
      recentDeposits: farmerDeposits,
      cattleList: farmer.cattle,
      recentFlagsCount: recentFlags
    });

    res.json({
      success: true,
      farmer: {
        ...farmer,
        dynamicCapacity,
        baseCapacity: baseSum,
        seasonalMultiplier: multiplier,
        purityScore: purity.score,
        purityGrade: purity.grade,
        purityDetails: purity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createFarmer = async (req, res) => {
  try {
    const { name, phone, village, upiId, cattle } = req.body;
    const count = store.farmers.length + 1;
    const farmerCustomId = `FRM-DEL-${1000 + count}`;

    const newFarmer = {
      _id: `65f1a0${Date.now().toString(16).slice(-18)}`,
      farmerCustomId,
      name,
      phone,
      village,
      upiId: upiId || `${name.toLowerCase().replace(/\s+/g, '')}@upi`,
      purityScore: 100,
      cattle: cattle || [],
      createdAt: new Date()
    };

    store.farmers.push(newFarmer);

    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully under Bharat Pashudhan / NDLM standards.',
      farmer: newFarmer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
