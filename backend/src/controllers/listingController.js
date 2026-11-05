const ProduceListing = require('../models/ProduceListing');
const Order = require('../models/Order');
const { createNotification } = require('../services/notificationService');
const { VALID_UNITS } = require('../utils/units');

/**
 * Create a new produce listing (Farmer only, Approved only)
 */
const createListing = async (req, res) => {
  try {
    const {
      produceName,
      totalQuantity,
      quantityUnit,
      pricePerUnit,
      villageTown,
      district,
      state,
      availabilityDate,
      description
    } = req.body;

    if (!produceName || !totalQuantity || !quantityUnit || !pricePerUnit || !availabilityDate) {
      return res.status(400).json({
        success: false,
        message: 'Produce name, quantity, unit, price, and availability date are required.'
      });
    }

    if (!VALID_UNITS.includes(quantityUnit)) {
      return res.status(400).json({
        success: false,
        message: `Invalid unit. Supported units: ${VALID_UNITS.join(', ')}`
      });
    }

    if (totalQuantity <= 0 || pricePerUnit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and price must be greater than zero.'
      });
    }

    const listing = await ProduceListing.create({
      farmer: req.user._id,
      produceName: produceName.trim(),
      totalQuantity: Number(totalQuantity),
      reservedQuantity: 0,
      quantityUnit,
      pricePerUnit: Number(pricePerUnit),
      villageTown: (villageTown || req.user.profile?.villageTown || 'Gudlavalleru').trim(),
      district: (district || req.user.profile?.district || 'Krishna').trim(),
      state: (state || req.user.profile?.state || 'Andhra Pradesh').trim(),
      availabilityDate: new Date(availabilityDate),
      description: description ? description.trim() : '',
      status: 'active'
    });

    return res.status(201).json({
      success: true,
      message: 'Produce listing created successfully.',
      listing
    });
  } catch (error) {
    console.error('[Create Listing Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get listings belonging to the authenticated farmer
 */
const getMyListings = async (req, res) => {
  try {
    const listings = await ProduceListing.find({
      farmer: req.user._id,
      status: { $ne: 'archived' }
    }).sort({ createdAt: -1 });

    // Auto-update expired listings
    const now = new Date();
    const updatedListings = listings.map((l) => {
      const item = l.toObject({ virtuals: true });
      if (item.status === 'active' && new Date(item.availabilityDate) < now) {
        item.status = 'expired';
      }
      return item;
    });

    return res.json({
      success: true,
      listings: updatedListings
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Search and browse available listings (for Institutions & public)
 * Omits private contact information (phone/email).
 */
const searchListings = async (req, res) => {
  try {
    const { produce, district, location, minPrice, maxPrice, minQuantity, sortBy, sortOrder } = req.query;

    const query = {
      status: 'active',
      availabilityDate: { $gte: new Date() } // Not expired
    };

    if (produce) {
      query.produceName = { $regex: produce.trim(), $options: 'i' };
    }

    if (district) {
      query.district = { $regex: district.trim(), $options: 'i' };
    }

    if (location) {
      const locRegex = { $regex: location.trim(), $options: 'i' };
      query.$or = [{ villageTown: locRegex }, { district: locRegex }, { state: locRegex }];
    }

    if (minPrice || maxPrice) {
      query.pricePerUnit = {};
      if (minPrice) query.pricePerUnit.$gte = Number(minPrice);
      if (maxPrice) query.pricePerUnit.$lte = Number(maxPrice);
    }

    const sortOptions = {};
    if (sortBy === 'price' || sortBy === 'price_asc') {
      sortOptions.pricePerUnit = 1;
    } else if (sortBy === 'price_desc') {
      sortOptions.pricePerUnit = -1;
    } else if (sortBy === 'availability') {
      sortOptions.availabilityDate = 1;
    } else {
      sortOptions.createdAt = -1;
    }

    const listings = await ProduceListing.find(query)
      .populate('farmer', 'profile.fullName profile.villageTown profile.district profile.state')
      .sort(sortOptions);

    // Filter to only those with unreserved quantity > 0 and meet optional minQuantity
    const requiredMinQty = minQuantity && !isNaN(Number(minQuantity)) ? Number(minQuantity) : 0;
    const availableListings = listings
      .map((l) => l.toObject({ virtuals: true }))
      .filter((l) => l.unreservedQuantity > 0 && l.unreservedQuantity >= requiredMinQty);

    return res.json({
      success: true,
      count: availableListings.length,
      listings: availableListings
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single listing by ID
 */
const getListingById = async (req, res) => {
  try {
    const listing = await ProduceListing.findById(req.params.id)
      .populate('farmer', 'profile.fullName profile.villageTown profile.district profile.state');

    if (!listing || listing.status === 'archived') {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    return res.json({
      success: true,
      listing: listing.toObject({ virtuals: true })
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update listing details, stock, or price
 * Protects stock already committed to accepted orders!
 */
const updateListing = async (req, res) => {
  try {
    const listing = await ProduceListing.findOne({
      _id: req.params.id,
      farmer: req.user._id,
      status: { $ne: 'archived' }
    });

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found or access denied.' });
    }

    const {
      produceName,
      totalQuantity,
      pricePerUnit,
      availabilityDate,
      description,
      status
    } = req.body;

    const priceChanged = pricePerUnit !== undefined && Number(pricePerUnit) !== listing.pricePerUnit;
    const oldPrice = listing.pricePerUnit;

    // Check quantity reduction safety
    if (totalQuantity !== undefined) {
      const newTotal = Number(totalQuantity);
      if (newTotal < listing.reservedQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce total quantity below reserved stock (${listing.reservedQuantity} ${listing.quantityUnit}) committed to accepted orders.`
        });
      }
      listing.totalQuantity = newTotal;
    }

    if (produceName) listing.produceName = produceName.trim();
    if (pricePerUnit) listing.pricePerUnit = Number(pricePerUnit);
    if (description !== undefined) listing.description = description.trim();
    if (status && ['active', 'unavailable'].includes(status)) listing.status = status;

    if (availabilityDate) {
      listing.availabilityDate = new Date(availabilityDate);
      if (new Date(availabilityDate) > new Date() && listing.status === 'expired') {
        listing.status = 'active'; // Farmer extended the date, reactivate listing
      }
    }

    await listing.save();

    // If price or date changed, notify institutions with pending requests for this listing
    if (priceChanged || availabilityDate) {
      const pendingOrders = await Order.find({
        listing: listing._id,
        status: 'pending'
      }).populate('institution', '_id');

      for (const ord of pendingOrders) {
        let msg = `Listing for ${listing.produceName} was updated.`;
        if (priceChanged) {
          msg += ` Price updated from ₹${oldPrice} to ₹${listing.pricePerUnit} per ${listing.quantityUnit}.`;
        }
        await createNotification({
          recipient: ord.institution._id,
          title: 'Produce Listing Updated',
          message: msg,
          type: 'listing_updated',
          relatedModel: 'ProduceListing',
          relatedId: listing._id
        });
      }
    }

    return res.json({
      success: true,
      message: 'Listing updated successfully.',
      listing: listing.toObject({ virtuals: true })
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete listing (Soft delete)
 * Closes pending order requests, preserves accepted orders.
 */
const deleteListing = async (req, res) => {
  try {
    const listing = await ProduceListing.findOne({
      _id: req.params.id,
      farmer: req.user._id,
      status: { $ne: 'archived' }
    });

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found or access denied.' });
    }

    // Soft delete listing
    listing.status = 'archived';
    await listing.save();

    // Close all pending requests for this listing
    const pendingOrders = await Order.find({
      listing: listing._id,
      status: 'pending'
    });

    for (const ord of pendingOrders) {
      ord.status = 'cancelled';
      ord.cancellationReason = 'Listing removed by farmer';
      ord.cancelledBy = req.user._id;
      ord.statusHistory.push({
        status: 'cancelled',
        changedBy: req.user._id,
        note: 'Listing was removed by the farmer'
      });
      await ord.save();

      // Notify institution
      await createNotification({
        recipient: ord.institution,
        title: 'Order Request Cancelled',
        message: `Your pending request for ${listing.produceName} was cancelled because the farmer removed the listing.`,
        type: 'order_cancelled',
        relatedModel: 'Order',
        relatedId: ord._id
      });
    }

    return res.json({
      success: true,
      message: `Listing removed. ${pendingOrders.length} pending request(s) closed automatically. Existing accepted orders remain protected.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createListing,
  getMyListings,
  searchListings,
  getListingById,
  updateListing,
  deleteListing
};
