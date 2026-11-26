const Activity = require('../../models/Activity');
const { EVENTS } = require('../../constants');

/**
 * Writes one audit-log row for every ticket/comment event.
 * Payload shape (same for every event): { ticket, actor, details }
 */
async function logActivity({ ticket, actor, details = {} }, eventName) {
  await Activity.create({
    ticket: ticket._id,
    ticketNumber: ticket.ticketNumber,
    event: eventName,
    actor: actor._id,
    details,
  });
}

function register(eventBus) {
  Object.values(EVENTS).forEach((eventName) => eventBus.subscribe(eventName, logActivity));
}

module.exports = { register, logActivity };
