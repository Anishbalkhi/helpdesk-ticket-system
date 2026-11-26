/**
 * A tiny in-process event bus.
 *
 * Controllers call `eventBus.publish(EVENTS.X, payload)` after a change is saved.
 * Handlers (activity log, notifications, ...) subscribe with `eventBus.subscribe`.
 *
 * Why not Node's EventEmitter directly?
 *  - EventEmitter does not wait for async listeners, and an exception in one
 *    listener would crash the request.
 *  - Here every handler runs concurrently, `publish` waits for all of them, and a
 *    failing handler is logged instead of breaking the user's request
 *    (Promise.allSettled). The ticket change itself has already been saved.
 *
 * Because handlers are decoupled from controllers, adding a new action
 * (e.g. e-mail, Slack, webhooks) means adding one handler file — no controller changes.
 */
class EventBus {
  constructor() {
    this.handlers = new Map();
  }

  subscribe(eventName, handler) {
    if (!this.handlers.has(eventName)) this.handlers.set(eventName, []);
    this.handlers.get(eventName).push(handler);
    return () => {
      this.handlers.set(
        eventName,
        this.handlers.get(eventName).filter((h) => h !== handler)
      );
    };
  }

  async publish(eventName, payload) {
    const handlers = this.handlers.get(eventName) || [];
    // Promise.resolve().then(...) also turns a handler that throws synchronously into a rejection.
    const results = await Promise.allSettled(
      handlers.map((handler) => Promise.resolve().then(() => handler(payload, eventName)))
    );
    results.forEach((result) => {
      if (result.status === 'rejected') {
        // eslint-disable-next-line no-console
        console.error(`[events] handler for "${eventName}" failed:`, result.reason);
      }
    });
    return results;
  }

  clear() {
    this.handlers.clear();
  }
}

module.exports = new EventBus();
