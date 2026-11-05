const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getUsersList,
  approveUser,
  rejectUser,
  suspendUser,
  reactivateUser,
  moderateListing,
  moderateBulkRequirement,
  getAdminComplaints,
  resolveComplaint,
  moderateFeedback,
  getAuditLogs
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorizeRole } = require('../middleware/role');

// Centralized strict Admin-only middleware pipeline
router.use(authenticate, authorizeRole('admin'));

// Platform statistics and governance
router.get('/stats', getAdminStats);

// User governance
router.get('/users', getUsersList);
router.patch('/users/:userId/approve', approveUser);
router.patch('/users/:userId/reject', rejectUser);
router.patch('/users/:userId/suspend', suspendUser);
router.patch('/users/:userId/reactivate', reactivateUser);

// Content moderation (Listings & Requirements)
router.patch('/listings/:listingId/moderate', moderateListing);
router.patch('/bulk-requirements/:requirementId/moderate', moderateBulkRequirement);

// Complaints & Dispute resolution
router.get('/complaints', getAdminComplaints);
router.patch('/complaints/:complaintId/resolve', resolveComplaint);

// Feedback moderation
router.patch('/feedback/:feedbackId/moderate', moderateFeedback);

// Audit logging
router.get('/audit-logs', getAuditLogs);

module.exports = router;
