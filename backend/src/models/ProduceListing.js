const mongoose = require('mongoose');
const { VALID_UNITS } = require('../utils/units');

const produceListingSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    produceName: {
      type: String,
      required: [true, 'Produce name is required'],
      trim: true,
      index: true
    },
    totalQuantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative']
    },
    quantityUnit: {
      type: String,
      enum: VALID_UNITS,
      required: [true, 'Quantity unit is required']
    },
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0.01, 'Price per unit must be greater than 0']
    },
    villageTown: {
      type: String,
      required: [true, 'Village/Town is required'],
      trim: true
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      index: true
    },
    state: {
      type: String,
      required: true,
      trim: true,
      default: 'Andhra Pradesh'
    },
    availabilityDate: {
      type: Date,
      required: [true, 'Availability date is required'],
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'unavailable', 'expired', 'archived'],
      default: 'active',
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    isModerated: {
      type: Boolean,
      default: false,
      index: true
    },
    moderationReason: {
      type: String,
      default: ''
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: {
      type: Date
    },
    isDemoRecord: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for available/unreserved quantity
produceListingSchema.virtual('unreservedQuantity').get(function () {
  return Math.max(0, this.totalQuantity - this.reservedQuantity);
});

// Check if expired dynamically
produceListingSchema.methods.isExpired = function () {
  return new Date() > new Date(this.availabilityDate);
};

module.exports = mongoose.model('ProduceListing', produceListingSchema);
