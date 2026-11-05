const Notification = require('../models/Notification');

/**
 * Creates and persists an in-app notification in the database
 */
const createNotification = async ({
  recipient,
  title,
  message,
  type,
  relatedModel = null,
  relatedId = null,
  metadata = null
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      relatedModel,
      relatedId,
      metadata
    });
    return notification;
  } catch (error) {
    console.error('[Notification Error] Failed to create notification:', error.message);
    return null;
  }
};

module.exports = {
  createNotification
};
