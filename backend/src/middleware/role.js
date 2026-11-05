/**
 * Middleware to enforce role-based access control (RBAC)
 */
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}]`
      });
    }

    next();
  };
};

/**
 * Middleware to enforce that an account must be 'approved' before creating listings,
 * posting requirements, making offers, or placing order requests.
 */
const requireApprovedAccount = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Admins always have access
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.status === 'pending_approval') {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending administrator approval. You cannot initiate procurement activities yet.',
      accountStatus: req.user.status
    });
  }

  if (req.user.status === 'rejected') {
    return res.status(403).json({
      success: false,
      message: `Your account was rejected. Reason: ${req.user.rejectionReason || 'Details incomplete'}. Please update your profile and request re-approval.`,
      accountStatus: req.user.status,
      rejectionReason: req.user.rejectionReason
    });
  }

  if (req.user.status === 'suspended') {
    return res.status(403).json({
      success: false,
      message: `Your account is currently suspended. Reason: ${req.user.suspensionReason || 'Policy violation'}.`,
      accountStatus: req.user.status,
      suspensionReason: req.user.suspensionReason
    });
  }

  if (req.user.status !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Active approval required to perform this action.',
      accountStatus: req.user.status
    });
  }

  next();
};

module.exports = {
  authorizeRole,
  requireApprovedAccount
};
