const express = require('express');
const router = express.Router();
const milkController = require('../controllers/milkController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.post('/deposit', milkController.recordDeposit);
router.post('/sync-batch', milkController.syncBatch);
router.get('/farmer/:id', milkController.getFarmerDeposits);
router.get('/recent', milkController.getRecentDeposits);

module.exports = router;
