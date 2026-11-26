import client from './client';

/** @returns {Promise<{ notifications: object[], unreadCount: number }>} */
export async function getNotifications() {
  const res = await client.get('/notifications');
  return res.data.data;
}

export async function markNotificationRead(id) {
  const res = await client.patch(`/notifications/${id}/read`);
  return res.data.data.notification;
}

export async function markAllNotificationsRead() {
  const res = await client.patch('/notifications/read-all');
  return res.data.data; // { updated }
}
