const mongoose = require('mongoose');

// Atomic sequence generator used for human-friendly ticket numbers (#1001, #1002, ...).
// findOneAndUpdate + $inc is atomic, so two tickets created at the same moment
// can never get the same number.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

counterSchema.statics.next = async function next(name, start = 1000) {
  const counter = await this.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return start + counter.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
