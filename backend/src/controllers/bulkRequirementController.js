const BulkRequirement = require('../models/BulkRequirement');
const BulkOffer = require('../models/BulkOffer');
const Order = require('../models/Order');
const { createNotification } = require('../services/notificationService');
const { VALID_UNITS } = require('../utils/units');

/**
 * Calculate progress metrics for a bulk requirement
 * Committed = Accepted + Preparing
 * Delivered = Delivered
 * Remaining = requiredQuantity - Delivered
 * CapacityForOffers = Math.max(0, requiredQuantity - (Committed + Delivered))
 */
const getRequirementMetrics = async (requirementId, requiredQuantity) => {
  const orders = await Order.find({
    bulkRequirement: requirementId,
    status: { $in: ['accepted', 'preparing', 'delivered'] }
  });

  let committed = 0;
  let delivered = 0;

  for (const ord of orders) {
    if (ord.status === 'delivered') {
      delivered += ord.quantity;
    } else {
      committed += ord.quantity;
    }
  }

  const remaining = Math.max(0, requiredQuantity - delivered);
  const eligibleCapacity = Math.max(0, requiredQuantity - (committed + delivered));

  return {
    committedQuantity: committed,
    deliveredQuantity: delivered,
    remainingQuantity: remaining,
    eligibleCapacity,
    ordersCount: orders.length
  };
};

/**
 * Create a new bulk requirement (Institution only, Approved only)
 */
const createRequirement = async (req, res) => {
  try {
    const {
      produceName,
      requiredQuantity,
      quantityUnit,
      requiredDate,
      villageTown,
      district,
      state,
      targetPricePerUnit,
      description
    } = req.body;

    if (!produceName || !requiredQuantity || !quantityUnit || !requiredDate) {
      return res.status(400).json({
        success: false,
        message: 'Produce name, quantity, unit, and required date are required.'
      });
    }

    if (!VALID_UNITS.includes(quantityUnit)) {
      return res.status(400).json({
        success: false,
        message: `Invalid unit. Supported units: ${VALID_UNITS.join(', ')}`
      });
    }

    const reqQty = Number(requiredQuantity);
    if (reqQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Required quantity must be greater than zero.'
      });
    }

    const requirement = await BulkRequirement.create({
      institution: req.user._id,
      produceName: produceName.trim(),
      requiredQuantity: reqQty,
      quantityUnit,
      requiredDate: new Date(requiredDate),
      location: {
        villageTown: (villageTown || req.user.profile?.villageTown || 'Gudlavalleru').trim(),
        district: (district || req.user.profile?.district || 'Krishna').trim(),
        state: (state || req.user.profile?.state || 'Andhra Pradesh').trim()
      },
      targetPricePerUnit: targetPricePerUnit ? Number(targetPricePerUnit) : undefined,
      description: description ? description.trim() : '',
      status: 'open'
    });

    return res.status(201).json({
      success: true,
      message: 'Bulk requirement published successfully.',
      requirement
    });
  } catch (error) {
    console.error('[Create Requirement Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all active bulk requirements (for Farmers browsing opportunities)
 */
const getOpenRequirements = async (req, res) => {
  try {
    const { produce, district } = req.query;
    const query = {
      status: 'open',
      requiredDate: { $gte: new Date() } // Not expired
    };

    if (produce) {
      query.produceName = { $regex: produce.trim(), $options: 'i' };
    }
    if (district) {
      query['location.district'] = { $regex: district.trim(), $options: 'i' };
    }

    const requirements = await BulkRequirement.find(query)
      .populate('institution', 'profile.institutionName profile.district profile.state')
      .sort({ createdAt: -1 });

    const results = await Promise.all(
      requirements.map(async (r) => {
        const item = r.toObject();
        const metrics = await getRequirementMetrics(r._id, r.requiredQuantity);
        return {
          ...item,
          ...metrics
        };
      })
    );

    return res.json({
      success: true,
      count: results.length,
      requirements: results
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get requirements created by the authenticated institution
 */
const getMyRequirements = async (req, res) => {
  try {
    const requirements = await BulkRequirement.find({
      institution: req.user._id
    }).sort({ createdAt: -1 });

    const now = new Date();
    const results = await Promise.all(
      requirements.map(async (r) => {
        const item = r.toObject();
        // Check dynamic expiry
        if (item.status === 'open' && new Date(item.requiredDate) < now) {
          item.status = 'expired';
        }
        const metrics = await getRequirementMetrics(r._id, r.requiredQuantity);
        return {
          ...item,
          ...metrics
        };
      })
    );

    return res.json({
      success: true,
      requirements: results
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single bulk requirement by ID with full metrics & orders
 */
const getRequirementById = async (req, res) => {
  try {
    const requirement = await BulkRequirement.findById(req.params.id)
      .populate('institution', 'profile.institutionName profile.contactPerson profile.district profile.state');

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Bulk requirement not found.' });
    }

    const metrics = await getRequirementMetrics(requirement._id, requirement.requiredQuantity);

    const orders = await Order.find({ bulkRequirement: requirement._id })
      .populate('farmer', 'profile.fullName profile.villageTown profile.district')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      requirement: requirement.toObject(),
      metrics,
      orders
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Edit bulk requirement
 * - If requiredQuantity changes: close pending offers automatically, notify affected farmers.
 * - If description or date changes: keep pending offers open, notify farmers.
 */
const updateRequirement = async (req, res) => {
  try {
    const requirement = await BulkRequirement.findOne({
      _id: req.params.id,
      institution: req.user._id
    });

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found or access denied.' });
    }

    const {
      requiredQuantity,
      requiredDate,
      targetPricePerUnit,
      description,
      status
    } = req.body;

    const qtyChanged = requiredQuantity !== undefined && Number(requiredQuantity) !== requirement.requiredQuantity;
    const oldQty = requirement.requiredQuantity;

    // Check if new quantity is lower than already committed quantity
    if (qtyChanged) {
      const metrics = await getRequirementMetrics(requirement._id, requirement.requiredQuantity);
      if (Number(requiredQuantity) < (metrics.committedQuantity + metrics.deliveredQuantity)) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce requirement below already committed/delivered quantity (${metrics.committedQuantity + metrics.deliveredQuantity} ${requirement.quantityUnit}).`
        });
      }
      requirement.requiredQuantity = Number(requiredQuantity);
    }

    if (requiredDate) requirement.requiredDate = new Date(requiredDate);
    if (targetPricePerUnit !== undefined) requirement.targetPricePerUnit = Number(targetPricePerUnit);
    if (description !== undefined) requirement.description = description.trim();
    if (status && ['open', 'closed'].includes(status)) requirement.status = status;

    await requirement.save();

    // If required quantity changed, close all pending offers automatically and notify farmers
    if (qtyChanged) {
      const pendingOffers = await BulkOffer.find({
        bulkRequirement: requirement._id,
        status: 'pending'
      });

      for (const off of pendingOffers) {
        off.status = 'closed';
        await off.save();

        await createNotification({
          recipient: off.farmer,
          title: 'Bulk Requirement Quantity Changed',
          message: `The required quantity for ${requirement.produceName} was changed from ${oldQty} to ${requirement.requiredQuantity} ${requirement.quantityUnit}. Your pending offer was closed. Please review and submit a new offer.`,
          type: 'bulk_requirement_updated',
          relatedModel: 'BulkRequirement',
          relatedId: requirement._id
        });
      }
    } else if (description !== undefined || requiredDate !== undefined) {
      // Notify pending offer farmers of minor updates
      const pendingOffers = await BulkOffer.find({
        bulkRequirement: requirement._id,
        status: 'pending'
      });

      for (const off of pendingOffers) {
        await createNotification({
          recipient: off.farmer,
          title: 'Requirement Updated',
          message: `Institution updated requirement details for ${requirement.produceName}. Your offer remains active.`,
          type: 'bulk_requirement_updated',
          relatedModel: 'BulkRequirement',
          relatedId: requirement._id
        });
      }
    }

    return res.json({
      success: true,
      message: 'Requirement updated successfully.',
      requirement
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Close a bulk requirement
 * Closes all pending offers automatically and notifies affected farmers.
 */
const closeRequirement = async (req, res) => {
  try {
    const requirement = await BulkRequirement.findOne({
      _id: req.params.id,
      institution: req.user._id
    });

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found or access denied.' });
    }

    requirement.status = 'closed';
    await requirement.save();

    // Close all pending offers
    const pendingOffers = await BulkOffer.find({
      bulkRequirement: requirement._id,
      status: 'pending'
    });

    for (const off of pendingOffers) {
      off.status = 'closed';
      await off.save();

      await createNotification({
        recipient: off.farmer,
        title: 'Requirement Closed',
        message: `The requirement for ${requirement.produceName} was closed by the institution.`,
        type: 'bulk_offer_closed',
        relatedModel: 'BulkRequirement',
        relatedId: requirement._id
      });
    }

    return res.json({
      success: true,
      message: `Requirement closed. ${pendingOffers.length} pending offer(s) closed automatically.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reopen a closed requirement
 * Does NOT reopen old closed offers. Farmers must submit fresh offers.
 */
const reopenRequirement = async (req, res) => {
  try {
    const requirement = await BulkRequirement.findOne({
      _id: req.params.id,
      institution: req.user._id
    });

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }

    const { newRequiredDate } = req.body;
    if (newRequiredDate) {
      requirement.requiredDate = new Date(newRequiredDate);
    } else if (new Date(requirement.requiredDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an updated future required date to reopen an expired requirement.'
      });
    }

    requirement.status = 'open';
    await requirement.save();

    return res.json({
      success: true,
      message: 'Requirement reopened successfully. Farmers can now submit new offers.',
      requirement
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRequirement,
  getOpenRequirements,
  getMyRequirements,
  getRequirementById,
  updateRequirement,
  closeRequirement,
  reopenRequirement,
  getRequirementMetrics
};
