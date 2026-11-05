const User = require('../models/User');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const { createNotification } = require('../services/notificationService');

/**
 * Update authenticated user's profile
 */
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({ success: false, message: 'Profile details required.' });
    }

    // Update permitted fields only
    if (user.role === 'farmer') {
      if (profile.fullName !== undefined) user.profile.fullName = profile.fullName;
      if (profile.phone !== undefined) user.profile.phone = profile.phone;
      if (profile.villageTown !== undefined) user.profile.villageTown = profile.villageTown;
      if (profile.district !== undefined) user.profile.district = profile.district;
      if (profile.state !== undefined) user.profile.state = profile.state;
    } else if (user.role === 'institution') {
      if (profile.institutionName !== undefined) user.profile.institutionName = profile.institutionName;
      if (profile.contactPerson !== undefined) user.profile.contactPerson = profile.contactPerson;
      if (profile.phone !== undefined) user.profile.phone = profile.phone;
      if (profile.villageTown !== undefined) user.profile.villageTown = profile.villageTown;
      if (profile.district !== undefined) user.profile.district = profile.district;
      if (profile.state !== undefined) user.profile.state = profile.state;
    }

    await user.save();

    await AuditLog.create({
      actor: user._id,
      action: 'profile_updated',
      targetModel: 'User',
      targetId: user._id,
      details: { updatedFields: Object.keys(profile) }
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: user.toSafeObject(true)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Request account re-approval (for users whose accounts were rejected)
 */
const requestReapproval = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Only accounts with rejected status can request re-approval.'
      });
    }

    user.status = 'pending_approval';
    await user.save();

    // Notify admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification({
        recipient: admin._id,
        title: 'Re-approval Requested',
        message: `${user.email} (${user.role}) has updated their profile and requested re-approval.`,
        type: 'admin_notice',
        relatedModel: 'User',
        relatedId: user._id
      });
    }

    return res.json({
      success: true,
      message: 'Your re-approval request has been submitted to administration.',
      user: user.toSafeObject(true)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Request account deactivation
 * User cannot bypass unresolved order obligations
 */
const requestDeactivation = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user._id;

    // Check for active unresolved orders (accepted, preparing)
    const activeOrders = await Order.find({
      $or: [{ farmer: userId }, { institution: userId }],
      status: { $in: ['accepted', 'preparing'] }
    });

    if (activeOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot request deactivation while you have ${activeOrders.length} active order(s) in progress. Please fulfill or cancel them first.`
      });
    }

    const user = await User.findById(userId);
    user.status = 'deactivation_requested';
    user.deactivationReason = reason || 'User requested deactivation';
    await user.save();

    // Notify admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification({
        recipient: admin._id,
        title: 'Account Deactivation Requested',
        message: `${user.email} has requested account deactivation.`,
        type: 'admin_notice',
        relatedModel: 'User',
        relatedId: user._id
      });
    }

    return res.json({
      success: true,
      message: 'Deactivation request submitted. An administrator will review your account.',
      user: user.toSafeObject(true)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  updateProfile,
  requestReapproval,
  requestDeactivation
};
