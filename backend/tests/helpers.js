const request = require('supertest');
const createApp = require('../src/app');
const User = require('../src/models/User');
const { signToken } = require('../src/middleware/auth');

const app = createApp();
const api = () => request(app);

let counter = 0;

async function createUser({ role = 'user', name, password = 'Secret123' } = {}) {
  counter += 1;
  const user = await User.create({
    name: name || `${role} ${counter}`,
    email: `${role}${counter}@test.dev`,
    password,
    role,
  });
  return { user, token: signToken(user), auth: { Authorization: `Bearer ${signToken(user)}` } };
}

const validTicket = (overrides = {}) => ({
  title: 'Cannot log in to the portal',
  description: 'Every login attempt shows a spinner forever.',
  category: 'technical',
  priority: 'high',
  ...overrides,
});

async function createTicket(auth, overrides) {
  const res = await api().post('/api/tickets').set(auth).send(validTicket(overrides));
  if (res.status !== 201) throw new Error(`createTicket failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data.ticket;
}

module.exports = { app, api, createUser, validTicket, createTicket };
