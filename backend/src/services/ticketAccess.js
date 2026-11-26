const Ticket = require('../models/Ticket');
const AppError = require('../utils/AppError');
const { ROLES } = require('../constants');

const isAdmin = (user) => user.role === ROLES.ADMIN;

const isOwner = (ticket, user) =>
  (ticket.createdBy._id || ticket.createdBy).toString() === user._id.toString();

/**
 * Loads a ticket the current user is allowed to see.
 * A user asking for someone else's ticket gets 404 (not 403), so they cannot
 * discover which ticket IDs exist.
 */
async function findAccessibleTicket(ticketId, user) {
  const ticket = await Ticket.findById(ticketId).populate('createdBy', 'name email');
  if (!ticket || (!isAdmin(user) && !isOwner(ticket, user))) {
    throw AppError.notFound('Ticket not found');
  }
  return ticket;
}

module.exports = { isAdmin, isOwner, findAccessibleTicket };
