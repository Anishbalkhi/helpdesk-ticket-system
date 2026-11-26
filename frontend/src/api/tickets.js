import client from './client';

/**
 * GET /tickets with optional filters.
 * Empty values are dropped so the URL only carries real filters.
 * @returns {Promise<{ tickets: object[], pagination: { page, limit, total, totalPages } }>}
 */
export async function getTickets(params = {}) {
  const query = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null),
  );
  const res = await client.get('/tickets', { params: query });
  return res.data.data;
}

export async function getTicket(id) {
  const res = await client.get(`/tickets/${id}`);
  return res.data.data.ticket;
}

export async function createTicket(ticket) {
  const res = await client.post('/tickets', ticket);
  return res.data.data.ticket;
}

/** Send only the fields that changed. */
export async function updateTicket(id, changes) {
  const res = await client.patch(`/tickets/${id}`, changes);
  return res.data.data.ticket;
}

export async function deleteTicket(id) {
  const res = await client.delete(`/tickets/${id}`);
  return res.data;
}

export async function getComments(ticketId) {
  const res = await client.get(`/tickets/${ticketId}/comments`);
  return res.data.data.comments;
}

export async function addComment(ticketId, body) {
  const res = await client.post(`/tickets/${ticketId}/comments`, { body });
  return res.data.data.comment;
}

export async function getActivity(ticketId) {
  const res = await client.get(`/tickets/${ticketId}/activity`);
  return res.data.data.activity;
}
