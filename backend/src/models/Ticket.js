const mongoose = require('mongoose');
const { CATEGORIES, PRIORITIES, STATUSES } = require('../constants');

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: Number, required: true, unique: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, enum: CATEGORIES, required: true },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    // Numeric copy of priority so we can sort low → urgent (string sort would be alphabetical).
    priorityRank: { type: Number, default: PRIORITIES.indexOf('medium') },
    status: { type: String, enum: STATUSES, default: 'open' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    commentCount: { type: Number, default: 0 },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ticketSchema.pre('save', function syncDerivedFields(next) {
  if (this.isModified('priority')) {
    this.priorityRank = PRIORITIES.indexOf(this.priority);
  }
  if (this.isModified('status')) {
    if (this.status === 'resolved') this.resolvedAt = new Date();
    else if (this.status !== 'closed') this.resolvedAt = null;
  }
  next();
});

// Indexes that match the list screen's filters: "my tickets" and admin filters, newest first.
ticketSchema.index({ createdBy: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
