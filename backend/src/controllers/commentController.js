const Comment = require('../models/Comment');
const Ticket = require('../models/Ticket');
const AppError = require('../utils/AppError');
const { eventBus } = require('../events');
const { EVENTS } = require('../constants');
const { serializeComment } = require('../utils/serializers');
const { findAccessibleTicket } = require('../services/ticketAccess');

async function listComments(req, res) {
  const ticket = await findAccessibleTicket(req.params.id, req.user);
  const comments = await Comment.find({ ticket: ticket._id })
    .sort({ createdAt: 1, _id: 1 })
    .populate('author', 'name role');

  res.json({ success: true, data: { comments: comments.map(serializeComment) } });
}

async function addComment(req, res) {
  const ticket = await findAccessibleTicket(req.params.id, req.user);
  if (ticket.status === 'closed') {
    throw AppError.conflict('This ticket is closed, so new comments are not allowed');
  }

  const comment = await Comment.create({ ticket: ticket._id, author: req.user._id, body: req.body.body });
  await Ticket.updateOne({ _id: ticket._id }, { $inc: { commentCount: 1 } });
  await comment.populate('author', 'name role');

  await eventBus.publish(EVENTS.COMMENT_ADDED, {
    ticket,
    actor: req.user,
    details: { commentId: comment._id.toString(), excerpt: comment.body.slice(0, 100) },
  });

  res.status(201).json({ success: true, data: { comment: serializeComment(comment) } });
}

module.exports = { listComments, addComment };
