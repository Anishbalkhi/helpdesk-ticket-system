import client from './client';

/** @returns {Promise<{ total, byStatus, byPriority, byCategory, recentActivity }>} */
export async function getAdminStats() {
  const res = await client.get('/admin/stats');
  return res.data.data;
}
