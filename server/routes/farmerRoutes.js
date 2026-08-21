const express = require('express');
const router = express.Router();
const farmerController = require('../controllers/farmerController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.get('/', farmerController.getAllFarmers);
router.get('/:id', farmerController.getFarmerById);
router.post('/', farmerController.createFarmer);

module.exports = router;
