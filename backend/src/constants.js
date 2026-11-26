const ROLES = Object.freeze({ USER: 'user', ADMIN: 'admin' });

const CATEGORIES = Object.freeze(['technical', 'billing', 'account', 'feature_request', 'other']);

// Order matters: the index is used as the sort rank (low → urgent).
const PRIORITIES = Object.freeze(['low', 'medium', 'high', 'urgent']);

const STATUSES = Object.freeze(['open', 'in_progress', 'resolved', 'closed']);

const EVENTS = Object.freeze({
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  STATUS_CHANGED: 'ticket.status_changed',
  TICKET_RESOLVED: 'ticket.resolved',
  TICKET_DELETED: 'ticket.deleted',
  COMMENT_ADDED: 'comment.added',
});

module.exports = { ROLES, CATEGORIES, PRIORITIES, STATUSES, EVENTS };
