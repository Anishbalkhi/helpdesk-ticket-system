import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications';
import useClickOutside from '../hooks/useClickOutside';
import { timeAgo } from '../utils/format';

const POLL_INTERVAL_MS = 30_000;

/**
 * Bell icon with an unread badge and a dropdown list.
 * Polls GET /notifications every 30 seconds (skipped while the tab is hidden).
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // The bell is not important enough to show an error; the next poll retries.
    } finally {
      setLoaded(true);
    }
  }, []);

  // first load + polling
  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(wrapperRef, close, open);

  function toggle() {
    if (!open) load(); // fresh list every time it opens
    setOpen(!open);
  }

  async function handleClick(notification) {
    setOpen(false);
    if (!notification.read) {
      // update the UI straight away, then tell the server
      setNotifications((list) => list.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
      setUnreadCount((count) => Math.max(count - 1, 0));
      markNotificationRead(notification.id).catch(() => load());
    }
    if (notification.ticket) navigate(`/tickets/${notification.ticket}`);
  }

  async function handleMarkAll() {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      load();
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={toggle}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="card fixed inset-x-4 top-16 z-40 overflow-hidden sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:cursor-default disabled:text-slate-400"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Mark all read
            </button>
          </div>

          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {!loaded && <li className="px-4 py-6 text-center text-sm text-slate-500">Loading…</li>}
            {loaded && notifications.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-500">You're all caught up.</li>
            )}
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => handleClick(notification)}
                  className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50 ${
                    notification.read ? '' : 'bg-indigo-50/50'
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read ? 'bg-transparent' : 'bg-indigo-600'}`}
                    aria-hidden="true"
                  />
                  <span className="flex-1">
                    <span className={`block text-sm ${notification.read ? 'text-slate-600' : 'font-medium text-slate-900'}`}>
                      {notification.message}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">{timeAgo(notification.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
