const mongoose = require('mongoose');
const { EVENTS } = require('../constants');

// Append-only audit log written by the event handlers (never edited by API routes).
const activitySchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    // Kept so log lines stay readable even after the ticket is deleted.
    ticketNumber: { type: Number, required: true },
    event: { type: String, enum: Object.values(EVENTS), required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ ticket: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
