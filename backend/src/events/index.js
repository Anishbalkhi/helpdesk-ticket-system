const eventBus = require('./eventBus');
const activityLogger = require('./handlers/activityLogger');
const notifier = require('./handlers/notifier');

let registered = false;

// Wire every handler to the bus exactly once (called from app.js).
function registerEventHandlers() {
  if (registered) return;
  activityLogger.register(eventBus);
  notifier.register(eventBus);
  registered = true;
}

module.exports = { eventBus, registerEventHandlers };
