const BulkOffer = require('../models/BulkOffer');
const BulkRequirement = require('../models/BulkRequirement');
const Order = require('../models/Order');
const { createNotification } = require('../services/notificationService');
const { getRequirementMetrics } = require('./bulkRequirementController');

/**
 * Submit an offer against an open bulk requirement (Farmer only, Approved only)
 */
const submitOffer = async (req, res) => {
  try {
    const { requirementId, offeredQuantity, proposedPricePerUnit, notes } = req.body;

    if (!requirementId || !offeredQuantity || !proposedPricePerUnit) {
      return res.status(400).json({
        success: false,
        message: 'Requirement ID, offered quantity, and proposed price are required.'
      });
    }

    const qty = Number(offeredQuantity);
    const price = Number(proposedPricePerUnit);

    if (qty <= 0 || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Offered quantity and price must be greater than zero.'
      });
    }

    const requirement = await BulkRequirement.findById(requirementId);
    if (!requirement || requirement.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This requirement is no longer open for offers.'
      });
    }

    if (new Date(requirement.requiredDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This requirement has expired.'
      });
    }

    const offer = await BulkOffer.create({
      bulkRequirement: requirement._id,
      farmer: req.user._id,
      offeredQuantity: qty,
      acceptedQuantity: 0,
      quantityUnit: requirement.quantityUnit,
      proposedPricePerUnit: price,
      notes: notes ? notes.trim() : '',
      status: 'pending'
    });

    // Notify institution
    await createNotification({
      recipient: requirement.institution,
      title: 'New Bulk Offer Received',
      message: `A farmer submitted an offer of ${qty} ${requirement.quantityUnit} at ₹${price}/${requirement.quantityUnit} for ${requirement.produceName}.`,
      type: 'bulk_offer_received',
      relatedModel: 'BulkOffer',
      relatedId: offer._id
    });

    return res.status(201).json({
      success: true,
      message: 'Offer submitted successfully.',
      offer
    });
  } catch (error) {
    console.error('[Submit Offer Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get offers submitted by authenticated farmer
 */
const getMyOffers = async (req, res) => {
  try {
    const offers = await BulkOffer.find({ farmer: req.user._id })
      .populate({
        path: 'bulkRequirement',
        select: 'produceName requiredQuantity quantityUnit requiredDate location status institution',
        populate: {
          path: 'institution',
          select: 'profile.institutionName profile.district'
        }
      })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      offers
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get offers for a specific requirement (Institution only)
 */
const getOffersForRequirement = async (req, res) => {
  try {
    const requirement = await BulkRequirement.findOne({
      _id: req.params.requirementId,
      institution: req.user._id
    });

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found or access denied.' });
    }

    const { sortBy, sortOrder } = req.query;
    const sort = {};
    if (sortBy === 'price') {
      sort.proposedPricePerUnit = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'quantity') {
      sort.offeredQuantity = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const offers = await BulkOffer.find({ bulkRequirement: requirement._id })
      .populate('farmer', 'profile.fullName profile.villageTown profile.district profile.state')
      .sort(sort);

    return res.json({
      success: true,
      offers
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Farmer edits pending offer
 */
const updateOffer = async (req, res) => {
  try {
    const offer = await BulkOffer.findOne({
      _id: req.params.id,
      farmer: req.user._id
    });

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found or access denied.' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending offers can be edited.'
      });
    }

    const { offeredQuantity, proposedPricePerUnit, notes } = req.body;
    if (offeredQuantity) offer.offeredQuantity = Number(offeredQuantity);
    if (proposedPricePerUnit) offer.proposedPricePerUnit = Number(proposedPricePerUnit);
    if (notes !== undefined) offer.notes = notes.trim();

    await offer.save();

    return res.json({
      success: true,
      message: 'Offer updated successfully.',
      offer
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Farmer withdraws pending offer
 * Handles simultaneous withdrawal and acceptance safely
 */
const withdrawOffer = async (req, res) => {
  try {
    const offer = await BulkOffer.findOne({
      _id: req.params.id,
      farmer: req.user._id
    });

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found or access denied.' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw offer because its status is already "${offer.status}".`
      });
    }

    offer.status = 'withdrawn';
    await offer.save();

    return res.json({
      success: true,
      message: 'Offer withdrawn successfully.',
      offer
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Institution accepts an offer (all or partial)
 * Creates a committed order for the accepted quantity at the proposed price!
 */
const acceptOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { acceptQuantity } = req.body;

    const offer = await BulkOffer.findById(offerId).populate('bulkRequirement');
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }

    const requirement = offer.bulkRequirement;
    if (requirement.institution.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Offer is no longer pending (current status: ${offer.status}).`
      });
    }

    if (requirement.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: `Requirement is no longer open (current status: ${requirement.status}).`
      });
    }

    const availableToAccept = offer.offeredQuantity - offer.acceptedQuantity;
    const qtyToAccept = acceptQuantity ? Number(acceptQuantity) : availableToAccept;

    if (qtyToAccept <= 0) {
      return res.status(400).json({ success: false, message: 'Accepted quantity must be greater than zero.' });
    }

    if (qtyToAccept > availableToAccept) {
      return res.status(400).json({
        success: false,
        message: `Accepted quantity (${qtyToAccept}) exceeds remaining offered quantity (${availableToAccept}).`
      });
    }

    // Check against requirement remaining eligible capacity
    const metrics = await getRequirementMetrics(requirement._id, requirement.requiredQuantity);
    if (qtyToAccept > metrics.eligibleCapacity) {
      return res.status(400).json({
        success: false,
        message: `Accepted quantity (${qtyToAccept} ${requirement.quantityUnit}) exceeds requirement remaining capacity (${metrics.eligibleCapacity} ${requirement.quantityUnit}).`
      });
    }

    // Create committed order directly for accepted offer
    const totalAmount = qtyToAccept * offer.proposedPricePerUnit;
    const order = await Order.create({
      orderType: 'bulk_offer',
      bulkRequirement: requirement._id,
      bulkOffer: offer._id,
      farmer: offer.farmer,
      institution: req.user._id,
      produceName: requirement.produceName,
      quantity: qtyToAccept,
      quantityUnit: requirement.quantityUnit,
      pricePerUnit: offer.proposedPricePerUnit,
      totalAmount,
      requiredDate: requirement.requiredDate,
      status: 'accepted',
      stockReserved: true,
      notes: `Accepted from bulk offer: ${qtyToAccept} ${requirement.quantityUnit}`,
      statusHistory: [
        {
          status: 'accepted',
          changedBy: req.user._id,
          note: `Bulk offer accepted for ${qtyToAccept} ${requirement.quantityUnit}`
        }
      ]
    });

    // Update offer
    offer.acceptedQuantity += qtyToAccept;
    if (offer.acceptedQuantity >= offer.offeredQuantity) {
      offer.status = 'accepted';
    }
    await offer.save();

    // Check if requirement is now fully committed
    const updatedMetrics = await getRequirementMetrics(requirement._id, requirement.requiredQuantity);
    if (updatedMetrics.eligibleCapacity <= 0) {
      requirement.status = 'fully_committed';
      await requirement.save();

      // Close other pending offers for this requirement
      const otherPendingOffers = await BulkOffer.find({
        bulkRequirement: requirement._id,
        _id: { $ne: offer._id },
        status: 'pending'
      });

      for (const off of otherPendingOffers) {
        off.status = 'closed';
        await off.save();

        await createNotification({
          recipient: off.farmer,
          title: 'Bulk Requirement Fully Committed',
          message: `The requirement for ${requirement.produceName} has reached full committed capacity. Your pending offer has been closed.`,
          type: 'bulk_offer_closed',
          relatedModel: 'BulkRequirement',
          relatedId: requirement._id
        });
      }
    }

    // Notify farmer of acceptance
    await createNotification({
      recipient: offer.farmer,
      title: 'Bulk Offer Accepted!',
      message: `Institution accepted ${qtyToAccept} ${requirement.quantityUnit} of your offer for ${requirement.produceName} at ₹${offer.proposedPricePerUnit}/${requirement.quantityUnit}. An active order has been created.`,
      type: 'bulk_offer_accepted',
      relatedModel: 'Order',
      relatedId: order._id
    });

    return res.json({
      success: true,
      message: `Offer accepted for ${qtyToAccept} ${requirement.quantityUnit}. Order created.`,
      order,
      offer
    });
  } catch (error) {
    console.error('[Accept Offer Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Institution rejects an offer
 */
const rejectOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { reason } = req.body;

    const offer = await BulkOffer.findById(offerId).populate('bulkRequirement');
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }

    if (offer.bulkRequirement.institution.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Only pending offers can be rejected (current: ${offer.status}).`
      });
    }

    offer.status = 'rejected';
    await offer.save();

    await createNotification({
      recipient: offer.farmer,
      title: 'Offer Declined',
      message: `Your offer for ${offer.bulkRequirement.produceName} was declined by the institution.${reason ? ' Note: ' + reason : ''}`,
      type: 'bulk_offer_rejected',
      relatedModel: 'BulkOffer',
      relatedId: offer._id
    });

    return res.json({
      success: true,
      message: 'Offer rejected.',
      offer
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitOffer,
  getMyOffers,
  getOffersForRequirement,
  updateOffer,
  withdrawOffer,
  acceptOffer,
  rejectOffer
};
