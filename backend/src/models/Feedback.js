const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reviewedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reviewerRole: {
      type: String,
      enum: ['farmer', 'institution'],
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    },
    isRemovedByAdmin: {
      type: Boolean,
      default: false
    },
    adminRemovalReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Ensure one feedback per reviewer per order
feedbackSchema.index({ order: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
