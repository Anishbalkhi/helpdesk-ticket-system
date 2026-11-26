const Activity = require('../models/Activity');
const { serializeActivity } = require('../utils/serializers');
const { findAccessibleTicket } = require('../services/ticketAccess');

async function listTicketActivity(req, res) {
  const ticket = await findAccessibleTicket(req.params.id, req.user);
  const activity = await Activity.find({ ticket: ticket._id })
    .sort({ createdAt: -1, _id: -1 })
    .populate('actor', 'name role');

  res.json({ success: true, data: { activity: activity.map(serializeActivity) } });
}

module.exports = { listTicketActivity };
