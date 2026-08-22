const express = require('express');
const router = express.Router();
const milkController = require('../controllers/milkController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { milkDepositLimiter, syncBatchLimiter } = require('../middleware/rateLimiter');

// POST /api/milk/deposit  — rate limited: 30/min per IP (fraud prevention)
router.post('/deposit', milkDepositLimiter, milkController.recordDeposit);

// POST /api/milk/sync-batch — rate limited: 5/min per IP (offline sync)
router.post('/sync-batch', syncBatchLimiter, milkController.syncBatch);

// GET /api/milk/farmer/:id
router.get('/farmer/:id', milkController.getFarmerDeposits);

// GET /api/milk/recent
router.get('/recent', milkController.getRecentDeposits);

module.exports = router;
