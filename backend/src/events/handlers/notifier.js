const Notification = require('../../models/Notification');
const User = require('../../models/User');
const { EVENTS, ROLES } = require('../../constants');

const label = (value) => value.replace(/_/g, ' ');
const ownerId = (ticket) => (ticket.createdBy._id || ticket.createdBy).toString();

async function adminIds(exceptUserId) {
  const admins = await User.find({ role: ROLES.ADMIN }).select('_id').lean();
  return admins.map((a) => a._id.toString()).filter((id) => id !== exceptUserId);
}

async function notify(recipientIds, { type, message, ticket }) {
  const unique = [...new Set(recipientIds)];
  if (unique.length === 0) return;
  await Notification.insertMany(
    unique.map((recipient) => ({ recipient, type, message, ticket: ticket._id }))
  );
}

async function onTicketCreated({ ticket, actor }) {
  await notify(await adminIds(actor._id.toString()), {
    type: EVENTS.TICKET_CREATED,
    message: `New ${ticket.priority} priority ticket #${ticket.ticketNumber} from ${actor.name}: ${ticket.title}`,
    ticket,
  });
}

async function onStatusChanged({ ticket, actor, details }) {
  if (ownerId(ticket) === actor._id.toString()) return;
  await notify([ownerId(ticket)], {
    type: EVENTS.STATUS_CHANGED,
    message: `Ticket #${ticket.ticketNumber} moved from ${label(details.from)} to ${label(details.to)}`,
    ticket,
  });
}

async function onCommentAdded({ ticket, actor }) {
  const commenterIsOwner = ownerId(ticket) === actor._id.toString();
  const recipients = commenterIsOwner ? await adminIds(actor._id.toString()) : [ownerId(ticket)];
  await notify(recipients, {
    type: EVENTS.COMMENT_ADDED,
    message: `${actor.name} commented on ticket #${ticket.ticketNumber}`,
    ticket,
  });
}

function register(eventBus) {
  eventBus.subscribe(EVENTS.TICKET_CREATED, onTicketCreated);
  eventBus.subscribe(EVENTS.STATUS_CHANGED, onStatusChanged);
  eventBus.subscribe(EVENTS.COMMENT_ADDED, onCommentAdded);
}

module.exports = { register };
