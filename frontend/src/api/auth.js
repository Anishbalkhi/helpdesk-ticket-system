import client from './client';

// Every API response is { success, data, message }. These helpers return `data`.

export async function loginRequest(email, password) {
  const res = await client.post('/auth/login', { email, password });
  return res.data.data; // { token, user }
}

export async function registerRequest({ name, email, password }) {
  const res = await client.post('/auth/register', { name, email, password });
  return res.data.data; // { token, user }
}

export async function fetchMe() {
  const res = await client.get('/auth/me');
  return res.data.data.user;
}
