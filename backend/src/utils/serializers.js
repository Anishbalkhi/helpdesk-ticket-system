// Shape database documents into the public JSON described in docs/API.md.
// Keeping this in one place means internal fields (password hash, priorityRank, __v)
// can never leak by accident.

const idOf = (value) => (value && value._id ? value._id.toString() : value ? value.toString() : null);

const userRef = (user) =>
  user && user._id ? { id: user._id.toString(), name: user.name, role: user.role } : { id: idOf(user) };

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function serializeTicket(ticket) {
  const owner = ticket.createdBy;
  return {
    id: ticket._id.toString(),
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    createdBy:
      owner && owner._id
        ? { id: owner._id.toString(), name: owner.name, email: owner.email }
        : { id: idOf(owner) },
    commentCount: ticket.commentCount,
    resolvedAt: ticket.resolvedAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

function serializeComment(comment) {
  return {
    id: comment._id.toString(),
    ticket: idOf(comment.ticket),
    body: comment.body,
    author: userRef(comment.author),
    createdAt: comment.createdAt,
  };
}

function serializeActivity(activity) {
  return {
    id: activity._id.toString(),
    ticket: idOf(activity.ticket),
    ticketNumber: activity.ticketNumber,
    event: activity.event,
    actor: userRef(activity.actor),
    details: activity.details || {},
    createdAt: activity.createdAt,
  };
}

function serializeNotification(notification) {
  return {
    id: notification._id.toString(),
    type: notification.type,
    message: notification.message,
    ticket: idOf(notification.ticket),
    read: notification.read,
    createdAt: notification.createdAt,
  };
}

module.exports = {
  serializeUser,
  serializeTicket,
  serializeComment,
  serializeActivity,
  serializeNotification,
};
