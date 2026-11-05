const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      index: true
    },
    relatedModel: {
      type: String,
      enum: ['ProduceListing', 'Order', 'BulkRequirement', 'BulkOffer', 'User', 'System', 'Complaint']
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
