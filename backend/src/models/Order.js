const mongoose = require('mongoose');
const { VALID_UNITS } = require('../utils/units');

const orderSchema = new mongoose.Schema(
  {
    orderType: {
      type: String,
      enum: ['individual_listing', 'bulk_offer'],
      required: true,
      default: 'individual_listing'
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProduceListing'
    },
    bulkRequirement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BulkRequirement'
    },
    bulkOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BulkOffer'
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    produceName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, 'Quantity must be greater than zero']
    },
    quantityUnit: {
      type: String,
      enum: VALID_UNITS,
      required: true
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: [0.01, 'Price per unit must be greater than zero']
    },
    totalAmount: {
      type: Number,
      required: true
    },
    requiredDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'preparing', 'delivered', 'cancelled'],
      default: 'pending',
      index: true
    },
    stockReserved: {
      type: Boolean,
      default: false
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    farmerFeedbackGiven: {
      type: Boolean,
      default: false
    },
    institutionFeedbackGiven: {
      type: Boolean,
      default: false
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

module.exports = mongoose.model('Order', orderSchema);
