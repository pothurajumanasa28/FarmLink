const express = require('express');
const router = express.Router();
const {
  createListing,
  getMyListings,
  searchListings,
  getListingById,
  updateListing,
  deleteListing
} = require('../controllers/listingController');
const { authenticate } = require('../middleware/auth');
const { authorizeRole, requireApprovedAccount } = require('../middleware/role');

// Public / Institution search
router.get('/search', searchListings);
router.get('/:id', getListingById);

// Farmer authenticated management
router.post(
  '/',
  authenticate,
  authorizeRole('farmer'),
  requireApprovedAccount,
  createListing
);
router.get(
  '/my/all',
  authenticate,
  authorizeRole('farmer'),
  getMyListings
);
router.put(
  '/:id',
  authenticate,
  authorizeRole('farmer'),
  requireApprovedAccount,
  updateListing
);
router.delete(
  '/:id',
  authenticate,
  authorizeRole('farmer'),
  requireApprovedAccount,
  deleteListing
);

module.exports = router;
