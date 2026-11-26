import { Link } from 'react-router-dom';
import { ArrowRightLeft, CheckCircle2, History, MessageSquare, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { describeActivity } from '../utils/activity';
import { formatDateTime, timeAgo } from '../utils/format';

const EVENT_ICONS = {
  'ticket.created': { icon: PlusCircle, color: 'bg-blue-100 text-blue-600' },
  'ticket.updated': { icon: Pencil, color: 'bg-slate-100 text-slate-600' },
  'ticket.status_changed': { icon: ArrowRightLeft, color: 'bg-amber-100 text-amber-700' },
  'ticket.resolved': { icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
  'ticket.deleted': { icon: Trash2, color: 'bg-red-100 text-red-600' },
  'comment.added': { icon: MessageSquare, color: 'bg-violet-100 text-violet-600' },
};

/**
 * Vertical list of activity entries.
 * `showTicket` adds a "#1024" link in front of each line (used on the dashboard,
 * where entries come from many tickets).
 */
export default function ActivityTimeline({ activity, showTicket = false }) {
  if (activity.length === 0) {
    return <p className="text-sm text-slate-500">No activity yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {activity.map((entry) => {
        const { icon: Icon, color } = EVENT_ICONS[entry.event] || { icon: History, color: 'bg-slate-100 text-slate-600' };
        const { action, extra } = describeActivity(entry);
        // a deleted ticket has no page to link to
        const canLink = showTicket && entry.ticket && entry.event !== 'ticket.deleted';

        return (
          <li key={entry.id} className="flex gap-3">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${color}`} aria-hidden="true">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-slate-700">
                {showTicket &&
                  (canLink ? (
                    <Link to={`/tickets/${entry.ticket}`} className="mr-1.5 font-medium text-indigo-600 hover:underline">
                      #{entry.ticketNumber}
                    </Link>
                  ) : (
                    <span className="mr-1.5 font-medium text-slate-500">#{entry.ticketNumber}</span>
                  ))}
                <span className="font-medium text-slate-900">{entry.actor?.name || 'Someone'}</span> {action}
              </p>
              {extra && <p className="mt-0.5 truncate text-slate-500">{extra}</p>}
              <time className="text-xs text-slate-400" dateTime={entry.createdAt} title={formatDateTime(entry.createdAt)}>
                {timeAgo(entry.createdAt)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
