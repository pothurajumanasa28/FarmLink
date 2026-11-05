const express = require('express');
const router = express.Router();
const {
  createIndividualOrder,
  respondToOrder,
  updateOrderStatus,
  cancelOrder,
  getMyOrders
} = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { authorizeRole, requireApprovedAccount } = require('../middleware/role');

// All order operations require authentication
router.use(authenticate);

// Get current user's orders
router.get('/my', getMyOrders);

// Institution places order request on listing
router.post(
  '/individual',
  authorizeRole('institution'),
  requireApprovedAccount,
  createIndividualOrder
);

// Farmer accepts or rejects order request
router.patch(
  '/:orderId/respond',
  authorizeRole('farmer'),
  requireApprovedAccount,
  respondToOrder
);

// Farmer updates order status (preparing, delivered)
router.patch(
  '/:orderId/status',
  authorizeRole('farmer'),
  updateOrderStatus
);

// Cancel order (allowed for both farmer and institution before delivery)
router.patch(
  '/:orderId/cancel',
  cancelOrder
);

module.exports = router;
