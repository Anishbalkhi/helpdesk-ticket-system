const jwt = require('jsonwebtoken');
const { api, createUser } = require('./helpers');
const User = require('../src/models/User');
const { JWT_SECRET } = require('../src/config/env');

describe('Auth', () => {
  const newUser = { name: 'Asha Verma', email: 'Asha@Example.com', password: 'Secret123' };

  test('register creates a user (never an admin) and returns a token', async () => {
    const res = await api().post('/api/auth/register').send({ ...newUser, role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ name: 'Asha Verma', email: 'asha@example.com', role: 'user' });
    expect(res.body.data.user.password).toBeUndefined();

    const stored = await User.findOne({ email: 'asha@example.com' }).select('+password');
    expect(stored.password).not.toBe('Secret123'); // hashed
  });

  test('register rejects a duplicate email with 409', async () => {
    await api().post('/api/auth/register').send(newUser);
    const res = await api().post('/api/auth/register').send(newUser);
    expect(res.status).toBe(409);
  });

  test('register validates input and reports field errors', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'A', email: 'nope', password: 'short' });
    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  test('login works with correct credentials and fails with the same message otherwise', async () => {
    await api().post('/api/auth/register').send(newUser);

    const ok = await api().post('/api/auth/login').send({ email: 'asha@example.com', password: 'Secret123' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.user.email).toBe('asha@example.com');

    const wrongPassword = await api().post('/api/auth/login').send({ email: 'asha@example.com', password: 'Wrong1234' });
    const unknownEmail = await api().post('/api/auth/login').send({ email: 'ghost@example.com', password: 'Secret123' });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  test('/auth/me needs a valid token', async () => {
    const { auth, user } = await createUser();

    expect((await api().get('/api/auth/me')).status).toBe(401);
    expect((await api().get('/api/auth/me').set({ Authorization: 'Bearer garbage' })).status).toBe(401);

    const expired = jwt.sign({ sub: user._id.toString() }, JWT_SECRET, { expiresIn: -10 });
    const expiredRes = await api().get('/api/auth/me').set({ Authorization: `Bearer ${expired}` });
    expect(expiredRes.status).toBe(401);
    expect(expiredRes.body.message).toMatch(/expired/i);

    const res = await api().get('/api/auth/me').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(user._id.toString());
  });

  test('a token for a deleted user is rejected', async () => {
    const { auth, user } = await createUser();
    await User.deleteOne({ _id: user._id });
    expect((await api().get('/api/auth/me').set(auth)).status).toBe(401);
  });
});
