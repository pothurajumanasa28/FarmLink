const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const { createNotification } = require('../services/notificationService');

/**
 * Submit two-way feedback for a delivered order
 */
const submitFeedback = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    const userId = req.user._id;

    if (!orderId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and star rating (1-5) are required.'
      });
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Must be in delivered status
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for completed orders in "delivered" status.'
      });
    }

    // Verify user is either farmer or institution on this order
    const isFarmer = order.farmer.toString() === userId.toString();
    const isInstitution = order.institution.toString() === userId.toString();

    if (!isFarmer && !isInstitution) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this order.'
      });
    }

    // Check if feedback already submitted by this user for this order
    const existing = await Feedback.findOne({ order: order._id, reviewer: userId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted feedback for this order.'
      });
    }

    const reviewedUser = isFarmer ? order.institution : order.farmer;
    const reviewerRole = isFarmer ? 'farmer' : 'institution';

    const feedback = await Feedback.create({
      order: order._id,
      reviewer: userId,
      reviewedUser,
      reviewerRole,
      rating: numRating,
      comment: comment ? comment.trim() : ''
    });

    // Update flag on order
    if (isFarmer) {
      order.farmerFeedbackGiven = true;
    } else {
      order.institutionFeedbackGiven = true;
    }
    await order.save();

    // Notify the reviewed user
    await createNotification({
      recipient: reviewedUser,
      title: 'New Feedback & Rating Received',
      message: `You received a ${numRating}-star rating for order of ${order.produceName}.`,
      type: 'feedback_received',
      relatedModel: 'Order',
      relatedId: order._id
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been recorded.',
      feedback
    });
  } catch (error) {
    console.error('[Submit Feedback Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get feedback received by a specific user (public or self)
 */
const getUserFeedback = async (req, res) => {
  try {
    const feedbackList = await Feedback.find({
      reviewedUser: req.params.userId,
      isRemovedByAdmin: false
    })
      .populate('reviewer', 'profile.fullName profile.institutionName')
      .populate('order', 'produceName quantity quantityUnit createdAt')
      .sort({ createdAt: -1 });

    const totalRatings = feedbackList.length;
    const avgRating = totalRatings > 0
      ? (feedbackList.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings).toFixed(1)
      : '0.0';

    return res.json({
      success: true,
      averageRating: avgRating,
      totalRatings,
      feedback: feedbackList
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitFeedback,
  getUserFeedback
};
