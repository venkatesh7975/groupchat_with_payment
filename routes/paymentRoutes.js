const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const {
  createOrder,
  verifyPayment,
  getPaymentStatus
} = require('../controllers/paymentController');

// All routes require authentication
router.use(authenticateToken);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/status', getPaymentStatus);

module.exports = router; 