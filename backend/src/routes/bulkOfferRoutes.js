const express = require('express');
const router = express.Router();
const {
  submitOffer,
  getMyOffers,
  getOffersForRequirement,
  updateOffer,
  withdrawOffer,
  acceptOffer,
  rejectOffer
} = require('../controllers/bulkOfferController');
const { authenticate } = require('../middleware/auth');
const { authorizeRole, requireApprovedAccount } = require('../middleware/role');

router.use(authenticate);

// Farmer operations
router.post(
  '/',
  authorizeRole('farmer'),
  requireApprovedAccount,
  submitOffer
);
router.get(
  '/my',
  authorizeRole('farmer'),
  getMyOffers
);
router.put(
  '/:id',
  authorizeRole('farmer'),
  requireApprovedAccount,
  updateOffer
);
router.patch(
  '/:id/withdraw',
  authorizeRole('farmer'),
  withdrawOffer
);

// Institution operations
router.get(
  '/requirement/:requirementId',
  authorizeRole('institution'),
  getOffersForRequirement
);
router.patch(
  '/:offerId/accept',
  authorizeRole('institution'),
  requireApprovedAccount,
  acceptOffer
);
router.patch(
  '/:offerId/reject',
  authorizeRole('institution'),
  rejectOffer
);

module.exports = router;
