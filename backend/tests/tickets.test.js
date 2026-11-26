const { api, createUser, createTicket, validTicket } = require('./helpers');

describe('Tickets', () => {
  let alice;
  let bob;
  let admin;

  beforeEach(async () => {
    alice = await createUser({ name: 'Alice' });
    bob = await createUser({ name: 'Bob' });
    admin = await createUser({ role: 'admin', name: 'Admin' });
  });

  describe('create', () => {
    test('creates an open ticket with a sequential ticket number', async () => {
      const first = await createTicket(alice.auth, { status: 'resolved' });
      const second = await createTicket(alice.auth);

      expect(first).toMatchObject({ status: 'open', priority: 'high', category: 'technical', commentCount: 0 });
      expect(first.createdBy).toMatchObject({ id: alice.user._id.toString(), name: 'Alice' });
      expect(second.ticketNumber).toBe(first.ticketNumber + 1);
    });

    test('priority defaults to medium', async () => {
      const ticket = await createTicket(alice.auth, { priority: undefined });
      expect(ticket.priority).toBe('medium');
    });

    test('validates required fields and enums', async () => {
      const res = await api()
        .post('/api/tickets')
        .set(alice.auth)
        .send({ title: 'Hi', description: 'short', category: 'weather', priority: 'whenever' });
      expect(res.status).toBe(400);
      expect(res.body.errors.map((e) => e.field).sort()).toEqual(['category', 'description', 'priority', 'title']);
    });

    test('requires authentication', async () => {
      expect((await api().post('/api/tickets').send(validTicket())).status).toBe(401);
    });
  });

  describe('list', () => {
    test('users only see their own tickets; admins see all', async () => {
      await createTicket(alice.auth);
      await createTicket(alice.auth);
      await createTicket(bob.auth);

      const mine = await api().get('/api/tickets').set(alice.auth);
      expect(mine.body.data.tickets).toHaveLength(2);
      expect(mine.body.data.tickets.every((t) => t.createdBy.name === 'Alice')).toBe(true);

      const all = await api().get('/api/tickets').set(admin.auth);
      expect(all.body.data.pagination.total).toBe(3);
    });

    test('filters by status, priority and category and searches title/description', async () => {
      await createTicket(alice.auth, { title: 'Invoice is wrong', category: 'billing', priority: 'low' });
      await createTicket(alice.auth, { title: 'App crashes on start', priority: 'urgent' });
      await createTicket(alice.auth, { title: 'Dark mode please', category: 'feature_request', priority: 'low' });

      const low = await api().get('/api/tickets?priority=low').set(admin.auth);
      expect(low.body.data.tickets).toHaveLength(2);

      const billingLow = await api().get('/api/tickets?priority=low&category=billing').set(admin.auth);
      expect(billingLow.body.data.tickets.map((t) => t.title)).toEqual(['Invoice is wrong']);

      const search = await api().get('/api/tickets?search=CRASH').set(admin.auth);
      expect(search.body.data.tickets.map((t) => t.title)).toEqual(['App crashes on start']);

      const regexChars = await api().get('/api/tickets?search=(.*').set(admin.auth);
      expect(regexChars.status).toBe(200);
      expect(regexChars.body.data.tickets).toHaveLength(0);

      const open = await api().get('/api/tickets?status=open').set(admin.auth);
      expect(open.body.data.tickets).toHaveLength(3);
    });

    test('sorts by priority rank, not alphabetically', async () => {
      await createTicket(alice.auth, { priority: 'medium' });
      await createTicket(alice.auth, { priority: 'urgent' });
      await createTicket(alice.auth, { priority: 'low' });
      await createTicket(alice.auth, { priority: 'high' });

      const res = await api().get('/api/tickets?sort=-priority').set(admin.auth);
      expect(res.body.data.tickets.map((t) => t.priority)).toEqual(['urgent', 'high', 'medium', 'low']);
    });

    test('paginates', async () => {
      for (let i = 0; i < 5; i += 1) await createTicket(alice.auth, { title: `Ticket number ${i}` });

      const page2 = await api().get('/api/tickets?limit=2&page=2&sort=createdAt').set(alice.auth);
      expect(page2.body.data.pagination).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });
      expect(page2.body.data.tickets.map((t) => t.title)).toEqual(['Ticket number 2', 'Ticket number 3']);
    });

    test('rejects invalid query values', async () => {
      const res = await api().get('/api/tickets?status=done&limit=500').set(admin.auth);
      expect(res.status).toBe(400);
    });
  });

  describe('read', () => {
    test("a user gets 404 for someone else's ticket; the admin can read it", async () => {
      const ticket = await createTicket(alice.auth);
      expect((await api().get(`/api/tickets/${ticket.id}`).set(bob.auth)).status).toBe(404);
      expect((await api().get(`/api/tickets/${ticket.id}`).set(admin.auth)).status).toBe(200);
    });

    test('malformed ids return 400', async () => {
      expect((await api().get('/api/tickets/not-an-id').set(alice.auth)).status).toBe(400);
    });
  });

  describe('update', () => {
    test('the owner can edit fields while the ticket is open', async () => {
      const ticket = await createTicket(alice.auth);
      const res = await api()
        .patch(`/api/tickets/${ticket.id}`)
        .set(alice.auth)
        .send({ title: 'Updated title here', priority: 'low' });

      expect(res.status).toBe(200);
      expect(res.body.data.ticket).toMatchObject({ title: 'Updated title here', priority: 'low' });
    });

    test('users cannot change status', async () => {
      const ticket = await createTicket(alice.auth);
      const res = await api().patch(`/api/tickets/${ticket.id}`).set(alice.auth).send({ status: 'closed' });
      expect(res.status).toBe(403);
    });

    test('users cannot edit once the ticket is no longer open', async () => {
      const ticket = await createTicket(alice.auth);
      await api().patch(`/api/tickets/${ticket.id}`).set(admin.auth).send({ status: 'in_progress' });

      const res = await api().patch(`/api/tickets/${ticket.id}`).set(alice.auth).send({ title: 'Too late to edit' });
      expect(res.status).toBe(409);
    });

    test("users cannot edit someone else's ticket", async () => {
      const ticket = await createTicket(alice.auth);
      const res = await api().patch(`/api/tickets/${ticket.id}`).set(bob.auth).send({ title: 'Hijacked title' });
      expect(res.status).toBe(404);
    });

    test('admins can change status and priority; resolvedAt follows the status', async () => {
      const ticket = await createTicket(alice.auth);

      const resolved = await api()
        .patch(`/api/tickets/${ticket.id}`)
        .set(admin.auth)
        .send({ status: 'resolved', priority: 'urgent' });
      expect(resolved.status).toBe(200);
      expect(resolved.body.data.ticket).toMatchObject({ status: 'resolved', priority: 'urgent' });
      expect(resolved.body.data.ticket.resolvedAt).not.toBeNull();

      const reopened = await api().patch(`/api/tickets/${ticket.id}`).set(admin.auth).send({ status: 'open' });
      expect(reopened.body.data.ticket.resolvedAt).toBeNull();
    });

    test('an empty update is rejected', async () => {
      const ticket = await createTicket(alice.auth);
      const res = await api().patch(`/api/tickets/${ticket.id}`).set(alice.auth).send({});
      expect(res.status).toBe(400);
    });
  });

  describe('delete', () => {
    test('the owner can delete an open ticket, and its comments go with it', async () => {
      const ticket = await createTicket(alice.auth);
      await api().post(`/api/tickets/${ticket.id}/comments`).set(alice.auth).send({ body: 'Any update?' });

      const res = await api().delete(`/api/tickets/${ticket.id}`).set(alice.auth);
      expect(res.status).toBe(200);
      expect((await api().get(`/api/tickets/${ticket.id}`).set(admin.auth)).status).toBe(404);

      const Comment = require('../src/models/Comment');
      expect(await Comment.countDocuments({ ticket: ticket.id })).toBe(0);
    });

    test('the owner cannot delete once work has started, but an admin can', async () => {
      const ticket = await createTicket(alice.auth);
      await api().patch(`/api/tickets/${ticket.id}`).set(admin.auth).send({ status: 'in_progress' });

      expect((await api().delete(`/api/tickets/${ticket.id}`).set(alice.auth)).status).toBe(409);
      expect((await api().delete(`/api/tickets/${ticket.id}`).set(admin.auth)).status).toBe(200);
    });

    test("users cannot delete someone else's ticket", async () => {
      const ticket = await createTicket(alice.auth);
      expect((await api().delete(`/api/tickets/${ticket.id}`).set(bob.auth)).status).toBe(404);
    });
  });
});
