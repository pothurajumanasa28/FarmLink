const Complaint = require('../models/Complaint');
const ProduceListing = require('../models/ProduceListing');
const BulkRequirement = require('../models/BulkRequirement');
const Order = require('../models/Order');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const { createNotification } = require('../services/notificationService');

/**
 * File a new complaint or report (Farmers & Institutions)
 */
const createComplaint = async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Target type, target ID, reason, and detailed description are required.'
      });
    }

    if (!['listing', 'requirement', 'order', 'user', 'feedback'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type. Must be one of: listing, requirement, order, user, feedback.'
      });
    }

    let targetUser = null;

    // Verify existence of target and identify target counterparty
    if (targetType === 'listing') {
      const listing = await ProduceListing.findById(targetId);
      if (!listing) return res.status(404).json({ success: false, message: 'Referenced produce listing not found.' });
      targetUser = listing.farmer;
    } else if (targetType === 'requirement') {
      const reqDoc = await BulkRequirement.findById(targetId);
      if (!reqDoc) return res.status(404).json({ success: false, message: 'Referenced bulk requirement not found.' });
      targetUser = reqDoc.institution;
    } else if (targetType === 'order') {
      const order = await Order.findById(targetId);
      if (!order) return res.status(404).json({ success: false, message: 'Referenced order not found.' });
      // Counterparty is the other party in the order
      if (order.farmer.toString() === req.user._id.toString()) {
        targetUser = order.institution;
      } else if (order.institution.toString() === req.user._id.toString()) {
        targetUser = order.farmer;
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'You can only report orders in which you are a participant.' });
      }
    } else if (targetType === 'user') {
      const user = await User.findById(targetId);
      if (!user) return res.status(404).json({ success: false, message: 'Referenced user not found.' });
      targetUser = user._id;
    } else if (targetType === 'feedback') {
      const fb = await Feedback.findById(targetId);
      if (!fb) return res.status(404).json({ success: false, message: 'Referenced feedback not found.' });
      targetUser = fb.reviewer;
    }

    const complaint = await Complaint.create({
      reporter: req.user._id,
      targetType,
      targetId,
      targetUser,
      reason: reason.trim(),
      description: description.trim(),
      status: 'open'
    });

    // Notify admins of new complaint
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification({
        recipient: admin._id,
        title: 'New Complaint Filed',
        message: `A new complaint regarding a ${targetType} was submitted by ${req.user.email}.`,
        type: 'complaint_created',
        relatedModel: 'Complaint',
        relatedId: complaint._id
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Your report/complaint has been submitted. Platform administration will review it.',
      complaint
    });
  } catch (error) {
    console.error('[Create Complaint Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get complaints filed by the authenticated user
 */
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ reporter: req.user._id })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      complaints
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createComplaint,
  getMyComplaints
};
