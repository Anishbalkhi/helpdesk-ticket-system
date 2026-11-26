const mongoose = require('mongoose');
const { EVENTS } = require('../constants');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(EVENTS), required: true },
    message: { type: String, required: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
