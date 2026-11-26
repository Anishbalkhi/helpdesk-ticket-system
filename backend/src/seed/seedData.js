/**
 * Idempotent seeding: creates the admin account and, optionally, a demo user with
 * sample tickets. Safe to run many times — existing users/tickets are left alone.
 *
 * Used by `npm run seed` (scripts/seed.js) and, when SEED_ON_START=true, by the server
 * at startup (handy on hosts without a shell, e.g. Render's free tier).
 */
const { eventBus } = require('../events');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const Counter = require('../models/Counter');
const { EVENTS, ROLES } = require('../constants');

const adminAccount = () => ({
  name: process.env.ADMIN_NAME || 'Support Admin',
  email: (process.env.ADMIN_EMAIL || 'admin@helpdesk.dev').toLowerCase(),
  password: process.env.ADMIN_PASSWORD || 'Admin@12345',
});

const demoAccount = () => ({
  name: 'Demo User',
  email: (process.env.DEMO_USER_EMAIL || 'user@helpdesk.dev').toLowerCase(),
  password: process.env.DEMO_USER_PASSWORD || 'User@12345',
});

const SAMPLE_TICKETS = [
  {
    title: 'Password reset link returns 404',
    description: 'When I click the reset link from the email I land on a "page not found" error.',
    category: 'account',
    priority: 'high',
    status: 'in_progress',
    adminComment: 'Thanks for reporting — we have reproduced this and a fix is in progress.',
  },
  {
    title: 'Charged twice for November invoice',
    description: 'My card statement shows two identical charges for the November subscription.',
    category: 'billing',
    priority: 'urgent',
    status: 'open',
  },
  {
    title: 'Export tickets as CSV',
    description: 'It would help our team to export the ticket list as a CSV file for reporting.',
    category: 'feature_request',
    priority: 'low',
    status: 'resolved',
    adminComment: 'CSV export is now available from the tickets page. Marking this as resolved.',
  },
];

async function upsertUser({ name, email, password }, role, log) {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name, email, password, role });
    log(`Created ${role}: ${email}`);
  } else {
    log(`${role} already exists: ${email}`);
  }
  return user;
}

// Sample tickets go through the same events as real ones, so the activity log
// and notifications look exactly like real usage.
async function createSampleTickets(admin, user, log) {
  if (await Ticket.exists({ createdBy: user._id })) {
    log('Demo tickets already exist, skipping');
    return;
  }

  for (const sample of SAMPLE_TICKETS) {
    const ticket = await Ticket.create({
      title: sample.title,
      description: sample.description,
      category: sample.category,
      priority: sample.priority,
      ticketNumber: await Counter.next('ticket'),
      createdBy: user._id,
    });
    await ticket.populate('createdBy', 'name email');
    await eventBus.publish(EVENTS.TICKET_CREATED, {
      ticket,
      actor: user,
      details: { title: ticket.title, priority: ticket.priority, category: ticket.category },
    });

    if (sample.adminComment) {
      const comment = await Comment.create({ ticket: ticket._id, author: admin._id, body: sample.adminComment });
      await Ticket.updateOne({ _id: ticket._id }, { $inc: { commentCount: 1 } });
      await eventBus.publish(EVENTS.COMMENT_ADDED, {
        ticket,
        actor: admin,
        details: { commentId: comment._id.toString(), excerpt: comment.body.slice(0, 100) },
      });
    }

    if (sample.status !== 'open') {
      ticket.status = sample.status;
      await ticket.save();
      await eventBus.publish(EVENTS.STATUS_CHANGED, {
        ticket,
        actor: admin,
        details: { from: 'open', to: sample.status },
      });
      if (sample.status === 'resolved') {
        await eventBus.publish(EVENTS.TICKET_RESOLVED, { ticket, actor: admin, details: { from: 'open' } });
      }
    }
  }
  log(`Created ${SAMPLE_TICKETS.length} demo tickets`);
}

// eslint-disable-next-line no-console
async function seed({ demo = false, log = console.log } = {}) {
  // Outside demo mode, refuse to create a production admin with the publicly documented password.
  if (process.env.NODE_ENV === 'production' && !demo && !process.env.ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_PASSWORD before seeding a production database (or use demo mode on purpose)');
  }
  const admin = await upsertUser(adminAccount(), ROLES.ADMIN, log);
  if (demo) {
    const user = await upsertUser(demoAccount(), ROLES.USER, log);
    await createSampleTickets(admin, user, log);
  }
}

module.exports = { seed };
