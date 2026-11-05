const User = require('../models/User');
const ProduceListing = require('../models/ProduceListing');
const BulkRequirement = require('../models/BulkRequirement');
const BulkOffer = require('../models/BulkOffer');
const Order = require('../models/Order');
const Feedback = require('../models/Feedback');
const AuditLog = require('../models/AuditLog');
const Complaint = require('../models/Complaint');
const { createNotification } = require('../services/notificationService');

/**
 * Get comprehensive, real database-driven portal statistics
 */
const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      pendingUsers,
      approvedUsers,
      suspendedUsers,
      farmersCount,
      institutionsCount,
      totalListings,
      activeListings,
      totalRequirements,
      openRequirements,
      totalOrders,
      pendingOrders,
      acceptedOrders,
      preparingOrders,
      deliveredOrders,
      cancelledOrders,
      unresolvedComplaints,
      totalComplaints,
      totalFeedback
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: { $ne: 'admin' }, status: 'pending_approval' }),
      User.countDocuments({ role: { $ne: 'admin' }, status: 'approved' }),
      User.countDocuments({ role: { $ne: 'admin' }, status: 'suspended' }),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'institution' }),
      ProduceListing.countDocuments({ status: { $ne: 'archived' } }),
      ProduceListing.countDocuments({ status: 'active', availabilityDate: { $gte: new Date() } }),
      BulkRequirement.countDocuments(),
      BulkRequirement.countDocuments({ status: 'open', requiredDate: { $gte: new Date() } }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'accepted' }),
      Order.countDocuments({ status: 'preparing' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Complaint.countDocuments({ status: { $in: ['open', 'under_review'] } }),
      Complaint.countDocuments(),
      Feedback.countDocuments({ isRemovedByAdmin: false })
    ]);

    const recentAuditLogs = await AuditLog.find()
      .populate('actor', 'email role profile')
      .sort({ createdAt: -1 })
      .limit(15);

    return res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          pending: pendingUsers,
          approved: approvedUsers,
          suspended: suspendedUsers,
          farmers: farmersCount,
          institutions: institutionsCount
        },
        listings: {
          total: totalListings,
          active: activeListings
        },
        requirements: {
          total: totalRequirements,
          open: openRequirements
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          accepted: acceptedOrders,
          preparing: preparingOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        },
        complaints: {
          unresolved: unresolvedComplaints,
          total: totalComplaints
        },
        feedback: {
          total: totalFeedback
        }
      },
      recentLogs: recentAuditLogs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List all users with filtering by role, status, search, and location
 * Password hashes and reset tokens are strictly excluded.
 */
const getUsersList = async (req, res) => {
  try {
    const { role, status, search, location } = req.query;
    const query = { role: { $ne: 'admin' } };

    if (role && ['farmer', 'institution'].includes(role)) {
      query.role = role;
    }
    if (status) {
      query.status = status;
    }

    const orConditions = [];

    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      orConditions.push(
        { email: { $regex: sanitized, $options: 'i' } },
        { 'profile.fullName': { $regex: sanitized, $options: 'i' } },
        { 'profile.institutionName': { $regex: sanitized, $options: 'i' } }
      );
    }

    if (location && location.trim()) {
      const sanitizedLoc = location.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      orConditions.push(
        { 'profile.villageTown': { $regex: sanitizedLoc, $options: 'i' } },
        { 'profile.district': { $regex: sanitizedLoc, $options: 'i' } }
      );
    }

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    const users = await User.find(query)
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 });

    // Attach complaint counts for each user
    const userIds = users.map((u) => u._id);
    const complaints = await Complaint.aggregate([
      { $match: { targetUser: { $in: userIds } } },
      { $group: { _id: '$targetUser', count: { $sum: 1 } } }
    ]);
    const complaintMap = {};
    complaints.forEach((c) => {
      if (c && c._id) {
        complaintMap[c._id.toString()] = c.count;
      }
    });

    const safeUsers = users.map((u) => {
      const safe = u.toSafeObject(true);
      safe.reportsCount = complaintMap[u._id.toString()] || 0;
      return safe;
    });

    return res.json({
      success: true,
      users: safeUsers
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Approve a user account
 */
const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.status = 'approved';
    user.rejectionReason = '';
    await user.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'user_approved',
      targetModel: 'User',
      targetId: user._id,
      details: { email: user.email, role: user.role }
    });

    await createNotification({
      recipient: user._id,
      title: 'Account Approved!',
      message: 'Your account has been verified and approved by the platform administration.',
      type: 'account_status',
      relatedModel: 'User',
      relatedId: user._id
    });

    return res.json({
      success: true,
      message: `Account for ${user.email} has been approved.`,
      user: user.toSafeObject(true)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reject a user account with mandatory explanation
 */
const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is mandatory so the user can understand and correct their details.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.status = 'rejected';
    user.rejectionReason = reason.trim();
    await user.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'user_rejected',
      targetModel: 'User',
      targetId: user._id,
      details: { email: user.email, reason: user.rejectionReason }
    });

    await createNotification({
      recipient: user._id,
      title: 'Account Verification Rejected',
      message: `Your account could not be approved. Reason: ${user.rejectionReason}. Please update your profile information and request re-approval.`,
      type: 'account_status',
      relatedModel: 'User',
      relatedId: user._id
    });

    return res.json({
      success: true,
      message: `Account for ${user.email} rejected. User has been notified.`,
      user: user.toSafeObject(true)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Suspend a user account with mandatory reason
 * Policy for existing orders: Accepted/preparing orders are preserved. Pending offers/listings are hidden/closed.
 */
const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory suspension reason must be provided.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be suspended via this endpoint.' });
    }

    user.status = 'suspended';
    user.suspensionReason = reason.trim();
    await user.save();

    // Automatically close pending offers and hide active listings
    if (user.role === 'farmer') {
      await BulkOffer.updateMany(
        { farmer: user._id, status: 'pending' },
        { status: 'closed' }
      );

      await ProduceListing.updateMany(
        { farmer: user._id, status: 'active' },
        { status: 'unavailable' }
      );
    } else if (user.role === 'institution') {
      await BulkRequirement.updateMany(
        { institution: user._id, status: 'open' },
        { status: 'closed' }
      );
    }

    // Preserve accepted/preparing orders and notify counterparties
    const inProgressOrders = await Order.find({
      $or: [{ farmer: user._id }, { institution: user._id }],
      status: { $in: ['accepted', 'preparing'] }
    });

    for (const order of inProgressOrders) {
      const counterpartyId = order.farmer.toString() === user._id.toString() ? order.institution : order.farmer;
      await createNotification({
        recipient: counterpartyId,
        title: 'Order Notice: Counterparty Account Suspended',
        message: `The counterparty on order #${order._id.toString().slice(-6)} has been suspended by administration. Existing agreements remain documented. Please contact support if you need assistance.`,
        type: 'order_update',
        relatedModel: 'Order',
        relatedId: order._id
      });
    }

    await AuditLog.create({
      actor: req.user._id,
      action: 'user_suspended',
      targetModel: 'User',
      targetId: user._id,
      details: { email: user.email, reason: user.suspensionReason }
    });

    await createNotification({
      recipient: user._id,
      title: 'Account Suspended',
      message: `Your account has been suspended by administration. Reason: ${user.suspensionReason}. Contact platform support for assistance.`,
      type: 'account_status',
      relatedModel: 'User',
      relatedId: user._id
    });

    return res.json({
      success: true,
      message: `User ${user.email} has been suspended.`,
      user: user.toSafeObject(true)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reactivate a suspended or deactivated account
 */
const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.status = 'approved';
    user.suspensionReason = '';
    user.deactivationReason = '';
    await user.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'user_reactivated',
      targetModel: 'User',
      targetId: user._id,
      details: { email: user.email }
    });

    await createNotification({
      recipient: user._id,
      title: 'Account Reactivated',
      message: 'Your account has been reactivated. You can now participate in procurement activities.',
      type: 'account_status',
      relatedModel: 'User',
      relatedId: user._id
    });

    return res.json({
      success: true,
      message: `User ${user.email} reactivated successfully.`,
      user: user.toSafeObject(true)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Moderate a produce listing (hide, archive, or restore)
 * Preserves accepted order history and commitments.
 */
const moderateListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { action, reason } = req.body;

    if (!action || !['hide', 'restore', 'archive'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be one of: hide, restore, archive.'
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A moderation reason is mandatory.'
      });
    }

    const listing = await ProduceListing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const oldStatus = listing.status;
    let newStatus = oldStatus;

    if (action === 'hide') {
      newStatus = 'unavailable';
      listing.isModerated = true;
    } else if (action === 'archive') {
      newStatus = 'archived';
      listing.isModerated = true;
    } else if (action === 'restore') {
      newStatus = 'active';
      listing.isModerated = false;
    }

    listing.status = newStatus;
    listing.moderationReason = reason.trim();
    listing.moderatedBy = req.user._id;
    listing.moderatedAt = new Date();
    await listing.save();

    await AuditLog.create({
      actor: req.user._id,
      action: `listing_${action}d`,
      targetModel: 'ProduceListing',
      targetId: listing._id,
      details: {
        produceName: listing.produceName,
        farmer: listing.farmer,
        oldStatus,
        newStatus,
        reason: listing.moderationReason
      }
    });

    // Notify the farmer
    await createNotification({
      recipient: listing.farmer,
      title: `Produce Listing Moderated: ${action}`,
      message: `Your listing for "${listing.produceName}" was updated by administration to "${newStatus}". Reason: ${listing.moderationReason}`,
      type: 'listing_moderated',
      relatedModel: 'ProduceListing',
      relatedId: listing._id
    });

    return res.json({
      success: true,
      message: `Listing status updated to ${newStatus}.`,
      listing
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Moderate a bulk requirement (close or restore)
 */
const moderateBulkRequirement = async (req, res) => {
  try {
    const { requirementId } = req.params;
    const { action, reason } = req.body;

    if (!action || !['close', 'restore'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be "close" or "restore".'
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A moderation reason is mandatory.'
      });
    }

    const requirement = await BulkRequirement.findById(requirementId);
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Bulk requirement not found.' });
    }

    const newStatus = action === 'close' ? 'closed' : 'open';
    requirement.status = newStatus;
    requirement.isModerated = action === 'close';
    requirement.moderationReason = reason.trim();
    requirement.moderatedBy = req.user._id;
    requirement.moderatedAt = new Date();
    await requirement.save();

    await AuditLog.create({
      actor: req.user._id,
      action: `bulk_requirement_${action}d`,
      targetModel: 'BulkRequirement',
      targetId: requirement._id,
      details: {
        produceName: requirement.produceName,
        institution: requirement.institution,
        newStatus,
        reason: requirement.moderationReason
      }
    });

    await createNotification({
      recipient: requirement.institution,
      title: `Bulk Requirement Moderated: ${action}`,
      message: `Your requirement for "${requirement.produceName}" was updated by administration to "${newStatus}". Reason: ${requirement.moderationReason}`,
      type: 'requirement_moderated',
      relatedModel: 'BulkRequirement',
      relatedId: requirement._id
    });

    return res.json({
      success: true,
      message: `Requirement status updated to ${newStatus}.`,
      requirement
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all complaints with filtering
 */
const getAdminComplaints = async (req, res) => {
  try {
    const { status, targetType } = req.query;
    const query = {};

    if (status && ['open', 'under_review', 'resolved', 'dismissed'].includes(status)) {
      query.status = status;
    }
    if (targetType) {
      query.targetType = targetType;
    }

    const complaints = await Complaint.find(query)
      .populate('reporter', 'email role profile.fullName profile.institutionName')
      .populate('targetUser', 'email role profile.fullName profile.institutionName')
      .populate('resolvedBy', 'email profile.fullName')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      complaints
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Resolve or update complaint status
 */
const resolveComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, resolutionNote } = req.body;

    if (!status || !['under_review', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status required: under_review, resolved, or dismissed.'
      });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    complaint.status = status;
    if (resolutionNote !== undefined) {
      complaint.resolutionNote = resolutionNote.trim();
    }
    complaint.resolvedBy = req.user._id;
    complaint.resolvedAt = new Date();
    await complaint.save();

    await AuditLog.create({
      actor: req.user._id,
      action: `complaint_${status}`,
      targetModel: 'Complaint',
      targetId: complaint._id,
      details: {
        targetType: complaint.targetType,
        status,
        resolutionNote: complaint.resolutionNote
      }
    });

    // Notify the reporter
    await createNotification({
      recipient: complaint.reporter,
      title: `Complaint Status Updated: ${status.replace('_', ' ').toUpperCase()}`,
      message: `Your report regarding a ${complaint.targetType} is now ${status.replace('_', ' ')}. Resolution note: ${complaint.resolutionNote || 'Under administrative review.'}`,
      type: 'complaint_status',
      relatedModel: 'Complaint',
      relatedId: complaint._id
    });

    return res.json({
      success: true,
      message: `Complaint marked as ${status}.`,
      complaint
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Moderate feedback: Remove abusive or inappropriate feedback
 */
const moderateFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { removalReason } = req.body;

    if (!removalReason || !removalReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A reason for moderating feedback is required.'
      });
    }

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback entry not found.' });
    }

    feedback.isRemovedByAdmin = true;
    feedback.adminRemovalReason = removalReason.trim();
    await feedback.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'feedback_moderated',
      targetModel: 'Feedback',
      targetId: feedback._id,
      details: { reason: feedback.adminRemovalReason }
    });

    return res.json({
      success: true,
      message: 'Feedback entry has been removed from public view.',
      feedback
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get audit logs (Admin only, append-only records)
 */
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('actor', 'email role profile.fullName')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      logs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
