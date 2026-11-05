const Order = require('../models/Order');
const ProduceListing = require('../models/ProduceListing');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

/**
 * Place an individual order request on a farmer's listing
 * Institution only, Approved only.
 */
const createIndividualOrder = async (req, res) => {
  try {
    const { listingId, quantity, requiredDate, notes } = req.body;

    if (!listingId || !quantity || !requiredDate) {
      return res.status(400).json({
        success: false,
        message: 'Listing ID, quantity, and required date are required.'
      });
    }

    const orderQty = Number(quantity);
    if (orderQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity must be greater than zero.'
      });
    }

    const listing = await ProduceListing.findById(listingId).populate('farmer');
    if (!listing || listing.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This listing is no longer active or available for new requests.'
      });
    }

    if (new Date(listing.availabilityDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This listing has expired.'
      });
    }

    // Check available unreserved quantity
    const unreservedQty = listing.totalQuantity - listing.reservedQuantity;
    if (orderQty > unreservedQty) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${orderQty} ${listing.quantityUnit}) exceeds currently available stock (${unreservedQty} ${listing.quantityUnit}).`
      });
    }

    const totalAmount = orderQty * listing.pricePerUnit;

    const order = await Order.create({
      orderType: 'individual_listing',
      listing: listing._id,
      farmer: listing.farmer._id,
      institution: req.user._id,
      produceName: listing.produceName,
      quantity: orderQty,
      quantityUnit: listing.quantityUnit,
      pricePerUnit: listing.pricePerUnit,
      totalAmount,
      requiredDate: new Date(requiredDate),
      notes: notes ? notes.trim() : '',
      status: 'pending',
      stockReserved: false,
      statusHistory: [
        {
          status: 'pending',
          changedBy: req.user._id,
          note: 'Order request submitted by institution'
        }
      ]
    });

    // Notify farmer
    await createNotification({
      recipient: listing.farmer._id,
      title: 'New Order Request',
      message: `${req.user.profile?.institutionName || 'An institution'} requested ${orderQty} ${listing.quantityUnit} of ${listing.produceName}.`,
      type: 'order_request',
      relatedModel: 'Order',
      relatedId: order._id
    });

    return res.status(201).json({
      success: true,
      message: 'Order request placed successfully. Waiting for farmer acceptance.',
      order
    });
  } catch (error) {
    console.error('[Create Order Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Farmer accepts or rejects an order request
 * Accepts exact requested quantity and reserves stock atomically.
 */
const respondToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, reason } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "accept" or "reject".' });
    }

    const order = await Order.findOne({ _id: orderId, farmer: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order request not found or access denied.' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be responded to because its status is already "${order.status}".`
      });
    }

    if (action === 'accept') {
      // If individual listing order, atomically reserve stock on listing
      if (order.listing) {
        // Atomic conditional update to prevent overselling race conditions
        const updatedListing = await ProduceListing.findOneAndUpdate(
          {
            _id: order.listing,
            $expr: {
              $gte: [{ $subtract: ['$totalQuantity', '$reservedQuantity'] }, order.quantity]
            }
          },
          { $inc: { reservedQuantity: order.quantity } },
          { new: true }
        );

        if (!updatedListing) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient uncommitted stock available to accept this order.'
          });
        }
      }

      order.status = 'accepted';
      order.stockReserved = true;
      order.statusHistory.push({
        status: 'accepted',
        changedBy: req.user._id,
        note: reason || 'Accepted by farmer'
      });
      await order.save();

      // Notify institution
      await createNotification({
        recipient: order.institution,
        title: 'Order Request Accepted',
        message: `Farmer accepted your order for ${order.quantity} ${order.quantityUnit} of ${order.produceName}. Contact details are now available.`,
        type: 'order_accepted',
        relatedModel: 'Order',
        relatedId: order._id
      });

      return res.json({
        success: true,
        message: 'Order accepted successfully. Stock reserved.',
        order
      });
    } else {
      // Reject
      order.status = 'rejected';
      order.stockReserved = false;
      order.statusHistory.push({
        status: 'rejected',
        changedBy: req.user._id,
        note: reason || 'Rejected by farmer'
      });
      await order.save();

      // Notify institution
      await createNotification({
        recipient: order.institution,
        title: 'Order Request Declined',
        message: `Farmer declined your order for ${order.quantity} ${order.quantityUnit} of ${order.produceName}.${reason ? ' Note: ' + reason : ''}`,
        type: 'order_rejected',
        relatedModel: 'Order',
        relatedId: order._id
      });

      return res.json({
        success: true,
        message: 'Order request rejected.',
        order
      });
    }
  } catch (error) {
    console.error('[Respond to Order Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Advance order status (Preparing, Delivered)
 * Only Farmer can advance status!
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    if (!['preparing', 'delivered'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status can only be moved to "preparing" or "delivered".'
      });
    }

    const order = await Order.findOne({ _id: orderId, farmer: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized.' });
    }

    // Validate progression rules
    if (status === 'preparing' && order.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Order must be in "accepted" status before moving to "preparing".'
      });
    }

    if (status === 'delivered' && order.status !== 'preparing') {
      return res.status(400).json({
        success: false,
        message: 'Order must be in "preparing" status before moving to "delivered".'
      });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      changedBy: req.user._id,
      note: note || `Status updated to ${status}`
    });

    // If delivered, we can adjust listing total quantity and reserved quantity permanently
    if (status === 'delivered' && order.stockReserved && order.listing) {
      await ProduceListing.findByIdAndUpdate(order.listing, {
        $inc: {
          totalQuantity: -order.quantity,
          reservedQuantity: -order.quantity
        }
      });
      order.stockReserved = false; // Stock consumed
    }

    await order.save();

    // Notify institution
    await createNotification({
      recipient: order.institution,
      title: status === 'preparing' ? 'Order Is Preparing' : 'Order Delivered',
      message: status === 'preparing'
        ? `Farmer has started preparing your order for ${order.quantity} ${order.quantityUnit} of ${order.produceName}.`
        : `Your order for ${order.quantity} ${order.quantityUnit} of ${order.produceName} has been marked delivered! Please leave your feedback.`,
      type: status === 'preparing' ? 'order_preparing' : 'order_delivered',
      relatedModel: 'Order',
      relatedId: order._id
    });

    return res.json({
      success: true,
      message: `Order status updated to ${status}.`,
      order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Cancel an order
 * - Pending order: institution can withdraw; farmer is notified.
 * - Accepted or Preparing order: either party can cancel; restores reserved stock exactly once.
 * - Delivered order: CANNOT be cancelled!
 */
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const order = await Order.findOne({
      _id: orderId,
      $or: [{ farmer: userId }, { institution: userId }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized.' });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Delivered orders cannot be cancelled.'
      });
    }

    if (['cancelled', 'rejected'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order is already ${order.status}.`
      });
    }

    // Release reserved stock EXACTLY ONCE if stock was reserved
    if (order.stockReserved && order.listing) {
      await ProduceListing.findByIdAndUpdate(order.listing, {
        $inc: { reservedQuantity: -order.quantity }
      });
      order.stockReserved = false;
    }

    order.status = 'cancelled';
    order.cancelledBy = userId;
    order.cancellationReason = reason || 'Cancelled by user';
    order.statusHistory.push({
      status: 'cancelled',
      changedBy: userId,
      note: reason || 'Cancelled before delivery'
    });

    await order.save();

    // Determine the other party to notify
    const notifyRecipient = order.farmer.toString() === userId.toString() ? order.institution : order.farmer;

    await createNotification({
      recipient: notifyRecipient,
      title: 'Order Cancelled',
      message: `Order for ${order.quantity} ${order.quantityUnit} of ${order.produceName} was cancelled.${reason ? ' Reason: ' + reason : ''}`,
      type: 'order_cancelled',
      relatedModel: 'Order',
      relatedId: order._id
    });

    return res.json({
      success: true,
      message: 'Order cancelled successfully. Any reserved stock has been safely restored.',
      order
    });
  } catch (error) {
    console.error('[Cancel Order Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get orders for current user (Farmer or Institution)
 * Privacy rule: Contact details (phone, email) are revealed ONLY if order is accepted, preparing, or delivered!
 */
const getMyOrders = async (req, res) => {
  try {
    const isFarmer = req.user.role === 'farmer';
    const query = isFarmer ? { farmer: req.user._id } : { institution: req.user._id };

    const orders = await Order.find(query)
      .populate('farmer', 'email profile')
      .populate('institution', 'email profile')
      .sort({ createdAt: -1 });

    const sanitizedOrders = orders.map((o) => {
      const ord = o.toObject();
      const allowContact = ['accepted', 'preparing', 'delivered'].includes(ord.status);

      if (!allowContact) {
        if (ord.farmer?.profile) delete ord.farmer.profile.phone;
        if (ord.farmer) delete ord.farmer.email;
        if (ord.institution?.profile) delete ord.institution.profile.phone;
        if (ord.institution) delete ord.institution.email;
      }
      return ord;
    });

    return res.json({
      success: true,
      orders: sanitizedOrders
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createIndividualOrder,
  respondToOrder,
  updateOrderStatus,
  cancelOrder,
  getMyOrders
};
