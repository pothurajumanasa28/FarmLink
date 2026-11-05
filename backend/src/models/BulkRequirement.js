const mongoose = require('mongoose');
const { VALID_UNITS } = require('../utils/units');

const bulkRequirementSchema = new mongoose.Schema(
  {
    institution: {
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
    requiredQuantity: {
      type: Number,
      required: [true, 'Required quantity is required'],
      min: [0.01, 'Quantity must be greater than zero']
    },
    quantityUnit: {
      type: String,
      enum: VALID_UNITS,
      required: [true, 'Quantity unit is required']
    },
    requiredDate: {
      type: Date,
      required: [true, 'Required date is required'],
      index: true
    },
    location: {
      villageTown: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, default: 'Andhra Pradesh' }
    },
    targetPricePerUnit: {
      type: Number,
      min: [0, 'Target price must be positive']
    },
    description: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['open', 'fully_committed', 'closed', 'expired'],
      default: 'open',
      index: true
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
    timestamps: true
  }
);

module.exports = mongoose.model('BulkRequirement', bulkRequirementSchema);
