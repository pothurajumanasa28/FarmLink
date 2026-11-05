const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getUserFeedback
} = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');

// Public/authenticated view of user feedback
router.get('/user/:userId', getUserFeedback);

// Submit feedback for delivered order
router.post('/', authenticate, submitFeedback);

module.exports = router;
