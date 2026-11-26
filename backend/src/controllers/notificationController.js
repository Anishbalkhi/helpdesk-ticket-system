const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const { serializeNotification } = require('../utils/serializers');

async function listNotifications(req, res) {
  const recipient = req.user._id;
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipient }).sort({ createdAt: -1, _id: -1 }).limit(50),
    Notification.countDocuments({ recipient, read: false }),
  ]);

  res.json({
    success: true,
    data: { notifications: notifications.map(serializeNotification), unreadCount },
  });
}

async function markRead(req, res) {
  // Filtering by recipient means users can only touch their own notifications.
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) throw AppError.notFound('Notification not found');

  res.json({ success: true, data: { notification: serializeNotification(notification) } });
}

async function markAllRead(req, res) {
  const result = await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ success: true, data: { updated: result.modifiedCount } });
}

module.exports = { listNotifications, markRead, markAllRead };
