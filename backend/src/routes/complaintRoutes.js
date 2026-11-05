const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getMyComplaints
} = require('../controllers/complaintController');
const { authenticate } = require('../middleware/auth');

// Both farmers and institutions can submit complaints/reports
router.post('/', authenticate, createComplaint);
router.get('/my', authenticate, getMyComplaints);

module.exports = router;
