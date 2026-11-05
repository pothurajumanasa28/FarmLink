const express = require('express');
const router = express.Router();
const {
  createRequirement,
  getOpenRequirements,
  getMyRequirements,
  getRequirementById,
  updateRequirement,
  closeRequirement,
  reopenRequirement
} = require('../controllers/bulkRequirementController');
const { authenticate } = require('../middleware/auth');
const { authorizeRole, requireApprovedAccount } = require('../middleware/role');

// Public or farmer browsing open requirements
router.get('/open', getOpenRequirements);
router.get('/:id', getRequirementById);

// Institution operations
router.post(
  '/',
  authenticate,
  authorizeRole('institution'),
  requireApprovedAccount,
  createRequirement
);
router.get(
  '/my/all',
  authenticate,
  authorizeRole('institution'),
  getMyRequirements
);
router.put(
  '/:id',
  authenticate,
  authorizeRole('institution'),
  requireApprovedAccount,
  updateRequirement
);
router.patch(
  '/:id/close',
  authenticate,
  authorizeRole('institution'),
  closeRequirement
);
router.patch(
  '/:id/reopen',
  authenticate,
  authorizeRole('institution'),
  reopenRequirement
);

module.exports = router;
