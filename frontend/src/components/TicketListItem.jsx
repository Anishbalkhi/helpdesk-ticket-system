import { Link } from 'react-router-dom';
import { MessageSquare, User } from 'lucide-react';
import { CategoryBadge, PriorityBadge, StatusBadge } from './Badge';
import { formatDateTime, timeAgo } from '../utils/format';

/** One row in the tickets list. The whole row is a link to the detail page. */
export default function TicketListItem({ ticket, showSubmitter }) {
  return (
    <li>
      <Link
        to={`/tickets/${ticket.id}`}
        className="block px-4 py-4 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none sm:px-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              <span className="mr-1.5 text-slate-400">#{ticket.ticketNumber}</span>
              {ticket.title}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <CategoryBadge category={ticket.category} />
              {showSubmitter && ticket.createdBy && (
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                  {ticket.createdBy.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1" title="Comments">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                {ticket.commentCount ?? 0}
              </span>
              <span title={`Updated ${formatDateTime(ticket.updatedAt)}`}>
                Opened {formatDateTime(ticket.createdAt)} · updated {timeAgo(ticket.updatedAt)}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </Link>
    </li>
  );
}
