const express = require('express');
const router = express.Router();
const {
  updateProfile,
  requestReapproval,
  requestDeactivation
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.patch('/profile', authenticate, updateProfile);
router.post('/request-reapproval', authenticate, requestReapproval);
router.post('/request-deactivation', authenticate, requestDeactivation);

module.exports = router;
