const Ticket = require('../models/Ticket');
const Activity = require('../models/Activity');
const { CATEGORIES, PRIORITIES, STATUSES } = require('../constants');
const { serializeActivity } = require('../utils/serializers');

// Turn [{ _id: 'open', count: 3 }] into { open: 3, in_progress: 0, ... } with every key present.
const toCounts = (keys, rows) => {
  const counts = Object.fromEntries(keys.map((key) => [key, 0]));
  rows.forEach(({ _id, count }) => {
    counts[_id] = count;
  });
  return counts;
};

async function getStats(req, res) {
  // One round trip: $facet runs the three group-bys over the same collection scan.
  const [[facets], recentActivity] = await Promise.all([
    Ticket.aggregate([
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
          byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
        },
      },
    ]),
    Activity.find().sort({ createdAt: -1, _id: -1 }).limit(10).populate('actor', 'name role'),
  ]);

  const byStatus = toCounts(STATUSES, facets.byStatus);

  res.json({
    success: true,
    data: {
      total: Object.values(byStatus).reduce((sum, n) => sum + n, 0),
      byStatus,
      byPriority: toCounts(PRIORITIES, facets.byPriority),
      byCategory: toCounts(CATEGORIES, facets.byCategory),
      recentActivity: recentActivity.map(serializeActivity),
    },
  });
}

module.exports = { getStats };
