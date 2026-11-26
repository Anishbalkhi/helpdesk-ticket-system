const { api, createUser, createTicket } = require('./helpers');
const { eventBus } = require('../src/events');

describe('Comments', () => {
  let alice;
  let bob;
  let admin;
  let ticket;

  beforeEach(async () => {
    alice = await createUser({ name: 'Alice' });
    bob = await createUser({ name: 'Bob' });
    admin = await createUser({ role: 'admin', name: 'Admin' });
    ticket = await createTicket(alice.auth);
  });

  test('owner and admin can comment; comments come back oldest first with author info', async () => {
    await api().post(`/api/tickets/${ticket.id}/comments`).set(alice.auth).send({ body: 'Still broken' });
    await api().post(`/api/tickets/${ticket.id}/comments`).set(admin.auth).send({ body: 'Looking into it' });

    const res = await api().get(`/api/tickets/${ticket.id}/comments`).set(alice.auth);
    expect(res.status).toBe(200);
    expect(res.body.data.comments.map((c) => [c.author.name, c.author.role, c.body])).toEqual([
      ['Alice', 'user', 'Still broken'],
      ['Admin', 'admin', 'Looking into it'],
    ]);

    const updated = await api().get(`/api/tickets/${ticket.id}`).set(alice.auth);
    expect(updated.body.data.ticket.commentCount).toBe(2);
  });

  test("other users cannot read or add comments on someone else's ticket", async () => {
    expect((await api().get(`/api/tickets/${ticket.id}/comments`).set(bob.auth)).status).toBe(404);
    expect(
      (await api().post(`/api/tickets/${ticket.id}/comments`).set(bob.auth).send({ body: 'hi' })).status
    ).toBe(404);
  });

  test('empty comments are rejected and closed tickets cannot be commented on', async () => {
    expect(
      (await api().post(`/api/tickets/${ticket.id}/comments`).set(alice.auth).send({ body: '   ' })).status
    ).toBe(400);

    await api().patch(`/api/tickets/${ticket.id}`).set(admin.auth).send({ status: 'closed' });
    expect(
      (await api().post(`/api/tickets/${ticket.id}/comments`).set(alice.auth).send({ body: 'Hello?' })).status
    ).toBe(409);
  });
});

describe('Events: activity log and notifications', () => {
  let alice;
  let admin;

  beforeEach(async () => {
    alice = await createUser({ name: 'Alice' });
    admin = await createUser({ role: 'admin', name: 'Admin' });
  });

  const activityOf = async (ticketId, auth) =>
    (await api().get(`/api/tickets/${ticketId}/activity`).set(auth)).body.data.activity;

  test('every action is recorded in the activity log with useful details', async () => {
    const ticket = await createTicket(alice.auth, { priority: 'low' });
    await api().patch(`/api/tickets/${ticket.id}`).set(alice.auth).send({ priority: 'high', description: 'More detail about the issue' });
    await api().post(`/api/tickets/${ticket.id}/comments`).set(admin.auth).send({ body: 'On it' });
    await api().patch(`/api/tickets/${ticket.id}`).set(admin.auth).send({ status: 'resolved' });

    const activity = await activityOf(ticket.id, alice.auth);
    // newest first
    expect(activity.map((a) => a.event)).toEqual([
      'ticket.resolved',
      'ticket.status_changed',
      'comment.added',
      'ticket.updated',
      'ticket.created',
    ]);

    const byEvent = Object.fromEntries(activity.map((a) => [a.event, a]));
    expect(byEvent['ticket.updated'].details).toEqual({
      fields: ['description', 'priority'],
      changes: { priority: { from: 'low', to: 'high' } },
    });
    expect(byEvent['ticket.status_changed'].details).toEqual({ from: 'open', to: 'resolved' });
    expect(byEvent['ticket.status_changed'].actor).toMatchObject({ name: 'Admin', role: 'admin' });
    expect(byEvent['comment.added'].details.excerpt).toBe('On it');
  });

  test('an update that changes nothing does not create a log entry', async () => {
    const ticket = await createTicket(alice.auth);
    await api().patch(`/api/tickets/${ticket.id}`).set(alice.auth).send({ title: ticket.title });
    expect((await activityOf(ticket.id, alice.auth)).map((a) => a.event)).toEqual(['ticket.created']);
  });

  test('admins are notified of new tickets and owner comments; owners of status changes and admin replies', async () => {
    const ticket = await createTicket(alice.auth);

    let adminInbox = (await api().get('/api/notifications').set(admin.auth)).body.data;
    expect(adminInbox.unreadCount).toBe(1);
    expect(adminInbox.notifications[0]).toMatchObject({ type: 'ticket.created', ticket: ticket.id, read: false });

    await api().patch(`/api/tickets/${ticket.id}`).set(admin.auth).send({ status: 'in_progress' });
    await api().post(`/api/tickets/${ticket.id}/comments`).set(admin.auth).send({ body: 'Can you share a screenshot?' });
    await api().post(`/api/tickets/${ticket.id}/comments`).set(alice.auth).send({ body: 'Attached below' });

    const aliceInbox = (await api().get('/api/notifications').set(alice.auth)).body.data;
    expect(aliceInbox.notifications.map((n) => n.type)).toEqual(['comment.added', 'ticket.status_changed']);
    expect(aliceInbox.notifications[1].message).toMatch(/open to in progress/);

    adminInbox = (await api().get('/api/notifications').set(admin.auth)).body.data;
    expect(adminInbox.notifications.map((n) => n.type)).toEqual(['comment.added', 'ticket.created']);
  });

  test('notifications can be marked read, one or all, but only by their recipient', async () => {
    await createTicket(alice.auth);
    await createTicket(alice.auth);
    const { notifications } = (await api().get('/api/notifications').set(admin.auth)).body.data;

    expect((await api().patch(`/api/notifications/${notifications[0].id}/read`).set(alice.auth)).status).toBe(404);

    const one = await api().patch(`/api/notifications/${notifications[0].id}/read`).set(admin.auth);
    expect(one.body.data.notification.read).toBe(true);

    const all = await api().patch('/api/notifications/read-all').set(admin.auth);
    expect(all.body.data.updated).toBe(1);
    expect((await api().get('/api/notifications').set(admin.auth)).body.data.unreadCount).toBe(0);
  });

  test('a failing handler is logged but does not break the request', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const unsubscribe = eventBus.subscribe('ticket.created', () => {
      throw new Error('boom');
    });

    const res = await api()
      .post('/api/tickets')
      .set(alice.auth)
      .send({ title: 'Still created fine', description: 'Even though a handler failed', category: 'other' });

    unsubscribe();
    expect(res.status).toBe(201);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('Admin stats', () => {
  test('only admins can see stats, and every enum key is present', async () => {
    const alice = await createUser();
    const admin = await createUser({ role: 'admin' });
    const t = await createTicket(alice.auth, { priority: 'urgent', category: 'billing' });
    await createTicket(alice.auth, { priority: 'low' });
    await api().patch(`/api/tickets/${t.id}`).set(admin.auth).send({ status: 'resolved' });

    expect((await api().get('/api/admin/stats').set(alice.auth)).status).toBe(403);

    const res = await api().get('/api/admin/stats').set(admin.auth);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      total: 2,
      byStatus: { open: 1, in_progress: 0, resolved: 1, closed: 0 },
      byPriority: { low: 1, medium: 0, high: 0, urgent: 1 },
      byCategory: { technical: 1, billing: 1, account: 0, feature_request: 0, other: 0 },
    });
    expect(res.body.data.recentActivity.length).toBeGreaterThan(0);
  });
});

describe('Misc', () => {
  test('unknown API routes return a JSON 404 and bad JSON returns 400', async () => {
    const missing = await api().get('/api/nope');
    expect(missing.status).toBe(404);
    expect(missing.body.success).toBe(false);

    const badJson = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(badJson.status).toBe(400);
  });

  test('health check reports the database connection', async () => {
    const res = await api().get('/api/health');
    expect(res.body).toEqual({ success: true, status: 'ok', db: 'connected' });
  });
});
