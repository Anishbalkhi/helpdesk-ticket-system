const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validateObjectId } = require('../middleware/validate');
const schemas = require('../validators/schemas');
const { ROLES } = require('../constants');
const { isTest } = require('../config/env');

const auth = require('../controllers/authController');
const tickets = require('../controllers/ticketController');
const comments = require('../controllers/commentController');
const activity = require('../controllers/activityController');
const notifications = require('../controllers/notificationController');
const admin = require('../controllers/adminController');

const router = express.Router();
const h = asyncHandler;

// Slow down password guessing on the auth endpoints (off in tests).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => isTest,
  message: { success: false, message: 'Too many attempts, please try again in a few minutes' },
});

// ---------- Health ----------
router.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    success: connected,
    status: connected ? 'ok' : 'degraded',
    db: connected ? 'connected' : 'disconnected',
  });
});

// ---------- Auth ----------
router.post('/auth/register', authLimiter, validate(schemas.registerSchema), h(auth.register));
router.post('/auth/login', authLimiter, validate(schemas.loginSchema), h(auth.login));
router.get('/auth/me', authenticate, h(auth.me));

// ---------- Tickets ----------
router.get('/tickets', authenticate, validate(schemas.listTicketsQuerySchema, 'query'), h(tickets.listTickets));
router.post('/tickets', authenticate, validate(schemas.createTicketSchema), h(tickets.createTicket));
router.get('/tickets/:id', authenticate, validateObjectId(), h(tickets.getTicket));
router.patch('/tickets/:id', authenticate, validateObjectId(), validate(schemas.updateTicketSchema), h(tickets.updateTicket));
router.delete('/tickets/:id', authenticate, validateObjectId(), h(tickets.deleteTicket));

// ---------- Comments & activity (nested under a ticket) ----------
router.get('/tickets/:id/comments', authenticate, validateObjectId(), h(comments.listComments));
router.post('/tickets/:id/comments', authenticate, validateObjectId(), validate(schemas.commentSchema), h(comments.addComment));
router.get('/tickets/:id/activity', authenticate, validateObjectId(), h(activity.listTicketActivity));

// ---------- Notifications ----------
router.get('/notifications', authenticate, h(notifications.listNotifications));
router.patch('/notifications/read-all', authenticate, h(notifications.markAllRead));
router.patch('/notifications/:id/read', authenticate, validateObjectId('id'), h(notifications.markRead));

// ---------- Admin ----------
router.get('/admin/stats', authenticate, authorize(ROLES.ADMIN), h(admin.getStats));

module.exports = router;
