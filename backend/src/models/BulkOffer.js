const mongoose = require('mongoose');
const { VALID_UNITS } = require('../utils/units');

const bulkOfferSchema = new mongoose.Schema(
  {
    bulkRequirement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BulkRequirement',
      required: true,
      index: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    offeredQuantity: {
      type: Number,
      required: [true, 'Offered quantity is required'],
      min: [0.01, 'Quantity must be greater than zero']
    },
    acceptedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Accepted quantity cannot be negative']
    },
    quantityUnit: {
      type: String,
      enum: VALID_UNITS,
      required: true
    },
    proposedPricePerUnit: {
      type: Number,
      required: [true, 'Proposed price is required'],
      min: [0.01, 'Price must be greater than zero']
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'closed', 'withdrawn'],
      default: 'pending',
      index: true
    },
    notes: {
      type: String,
      trim: true
    },
    isDemoRecord: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('BulkOffer', bulkOfferSchema);
