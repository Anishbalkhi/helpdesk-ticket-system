const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const Counter = require('../models/Counter');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const { eventBus } = require('../events');
const { EVENTS } = require('../constants');
const { serializeTicket } = require('../utils/serializers');
const { isAdmin, findAccessibleTicket } = require('../services/ticketAccess');

const EDITABLE_FIELDS = ['title', 'description', 'category', 'priority'];
const NOT_OPEN_MESSAGE = 'Tickets can only be edited or deleted while they are open';

// "priority" is sorted by its numeric rank so low < medium < high < urgent.
const SORT_FIELDS = { createdAt: 'createdAt', updatedAt: 'updatedAt', priority: 'priorityRank' };

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildSort(sort) {
  const direction = sort.startsWith('-') ? -1 : 1;
  const field = SORT_FIELDS[sort.replace(/^-/, '')];
  return { [field]: direction, _id: direction };
}

async function listTickets(req, res) {
  const { status, priority, category, search, sort, page, limit } = req.validatedQuery;

  const filter = {};
  if (!isAdmin(req.user)) filter.createdBy = req.user._id;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .sort(buildSort(sort))
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name email'),
    Ticket.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      tickets: tickets.map(serializeTicket),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
}

async function createTicket(req, res) {
  const ticket = await Ticket.create({
    ...req.body,
    ticketNumber: await Counter.next('ticket'),
    status: 'open',
    createdBy: req.user._id,
  });
  await ticket.populate('createdBy', 'name email');

  await eventBus.publish(EVENTS.TICKET_CREATED, {
    ticket,
    actor: req.user,
    details: { title: ticket.title, priority: ticket.priority, category: ticket.category },
  });

  res.status(201).json({ success: true, data: { ticket: serializeTicket(ticket) } });
}

async function getTicket(req, res) {
  const ticket = await findAccessibleTicket(req.params.id, req.user);
  res.json({ success: true, data: { ticket: serializeTicket(ticket) } });
}

async function updateTicket(req, res) {
  const ticket = await findAccessibleTicket(req.params.id, req.user);
  const admin = isAdmin(req.user);

  if (!admin) {
    if (req.body.status !== undefined) throw AppError.forbidden('Only admins can change the ticket status');
    if (ticket.status !== 'open') throw AppError.conflict(NOT_OPEN_MESSAGE);
  }

  // Work out what actually changed so the activity log only records real changes.
  const changedFields = [];
  const changes = {};
  EDITABLE_FIELDS.forEach((field) => {
    const next = req.body[field];
    if (next !== undefined && next !== ticket[field]) {
      changedFields.push(field);
      if (field !== 'description') changes[field] = { from: ticket[field], to: next };
      ticket[field] = next;
    }
  });

  const previousStatus = ticket.status;
  const statusChanged = req.body.status !== undefined && req.body.status !== previousStatus;
  if (statusChanged) ticket.status = req.body.status;

  if (changedFields.length === 0 && !statusChanged) {
    return res.json({ success: true, data: { ticket: serializeTicket(ticket) } });
  }

  await ticket.save();

  const actor = req.user;
  if (changedFields.length > 0) {
    await eventBus.publish(EVENTS.TICKET_UPDATED, {
      ticket,
      actor,
      details: { fields: changedFields, changes },
    });
  }
  if (statusChanged) {
    await eventBus.publish(EVENTS.STATUS_CHANGED, {
      ticket,
      actor,
      details: { from: previousStatus, to: ticket.status },
    });
    if (ticket.status === 'resolved') {
      await eventBus.publish(EVENTS.TICKET_RESOLVED, { ticket, actor, details: { from: previousStatus } });
    }
  }

  return res.json({ success: true, data: { ticket: serializeTicket(ticket) } });
}

async function deleteTicket(req, res) {
  const ticket = await findAccessibleTicket(req.params.id, req.user);
  if (!isAdmin(req.user) && ticket.status !== 'open') throw AppError.conflict(NOT_OPEN_MESSAGE);

  await Promise.all([
    Comment.deleteMany({ ticket: ticket._id }),
    Notification.deleteMany({ ticket: ticket._id }),
    ticket.deleteOne(),
  ]);

  // Activity rows are intentionally kept: the deletion itself is part of the audit trail.
  await eventBus.publish(EVENTS.TICKET_DELETED, {
    ticket,
    actor: req.user,
    details: { title: ticket.title },
  });

  res.json({ success: true, message: 'Ticket deleted' });
}

module.exports = { listTickets, createTicket, getTicket, updateTicket, deleteTicket };
