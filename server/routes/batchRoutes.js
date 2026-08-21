const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.get('/', batchController.getAllBatches);
router.get('/:id', batchController.getBatchById);
router.post('/create', batchController.createBatch);
router.post('/reconcile', batchController.reconcileBatch);

module.exports = router;
