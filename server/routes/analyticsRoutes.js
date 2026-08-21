const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.get('/district', analyticsController.getDistrictAnalytics);
router.get('/alerts', analyticsController.getAlerts);
router.post('/verify-receipt', analyticsController.verifyReceipt);

module.exports = router;
