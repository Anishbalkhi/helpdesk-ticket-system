import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, History, Info, Pencil, Trash2 } from 'lucide-react';
import { deleteTicket, getActivity, getComments, getTicket, updateTicket } from '../api/tickets';
import { parseApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { enumLabel, formatDateTime } from '../utils/format';
import ActivityTimeline from '../components/ActivityTimeline';
import AdminTicketPanel from '../components/AdminTicketPanel';
import Alert from '../components/Alert';
import CommentThread from '../components/CommentThread';
import ConfirmModal from '../components/ConfirmModal';
import { CategoryBadge, PriorityBadge, StatusBadge } from '../components/Badge';
import { PageLoader } from '../components/Spinner';
import TicketForm from '../components/TicketForm';

const EDITABLE_FIELDS = ['title', 'description', 'category', 'priority'];

function DetailRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{children}</dd>
    </div>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  /** Loads the ticket, its comments and its activity in parallel. */
  const loadAll = useCallback(async () => {
    const [freshTicket, freshComments, freshActivity] = await Promise.all([
      getTicket(id),
      getComments(id),
      getActivity(id),
    ]);
    setTicket(freshTicket);
    setComments(freshComments);
    setActivity(freshActivity);
  }, [id]);

  // first load, and again when the id in the URL changes (e.g. from a notification)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    setEditing(false);

    loadAll()
      .catch((err) => {
        if (!cancelled) setLoadError(parseApiError(err, 'Could not load this ticket.').message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  // show a one-time message passed by another page ("Ticket #12 created"),
  // then drop it from history so a refresh doesn't show it again
  useEffect(() => {
    if (location.state?.flash) {
      setNotice(location.state.flash);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  // success messages disappear after a few seconds
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  /** After every change: show a message and re-fetch comments + activity. */
  async function refreshAfterAction(message) {
    setActionError('');
    if (message) setNotice(message);
    try {
      await loadAll();
    } catch (err) {
      setActionError(parseApiError(err).message);
    }
  }

  async function handleEditSubmit(values) {
    // only send the fields that really changed
    const changes = {};
    EDITABLE_FIELDS.forEach((field) => {
      if (values[field] !== ticket[field]) changes[field] = values[field];
    });

    if (Object.keys(changes).length === 0) {
      setEditing(false);
      return;
    }

    const updated = await updateTicket(ticket.id, changes); // errors are shown by <TicketForm>
    setTicket(updated);
    setEditing(false);
    await refreshAfterAction('Ticket updated');
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTicket(ticket.id);
      navigate('/tickets', { replace: true, state: { flash: `Ticket #${ticket.ticketNumber} deleted` } });
    } catch (err) {
      setActionError(parseApiError(err).message);
      setConfirmDelete(false);
      setDeleting(false);
    }
  }

  if (loading) return <PageLoader label="Loading ticket…" />;

  if (loadError || !ticket) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Alert>{loadError || 'Ticket not found.'}</Alert>
        <Link to="/tickets" className="btn btn-secondary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to tickets
        </Link>
      </div>
    );
  }

  const isOwner = ticket.createdBy?.id === user.id;
  const isOpen = ticket.status === 'open';
  const ownerCanChange = isOwner && isOpen;

  return (
    <div className="space-y-6">
      <Link to="/tickets" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to tickets
      </Link>

      <Alert variant="success" onClose={() => setNotice('')}>
        {notice}
      </Alert>
      <Alert onClose={() => setActionError('')}>{actionError}</Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* left column: ticket + comments */}
        <div className="space-y-6 lg:col-span-2">
          <article className="card p-5 sm:p-6">
            {editing ? (
              <>
                <h1 className="mb-4 text-lg font-semibold text-slate-900">Edit ticket #{ticket.ticketNumber}</h1>
                <TicketForm
                  initialValues={ticket}
                  submitLabel="Save changes"
                  onSubmit={handleEditSubmit}
                  onCancel={() => setEditing(false)}
                />
              </>
            ) : (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-400">#{ticket.ticketNumber}</p>
                    <h1 className="mt-0.5 break-words text-xl font-semibold text-slate-900">{ticket.title}</h1>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                      <CategoryBadge category={ticket.category} />
                    </div>
                  </div>

                  {ownerCanChange && (
                    <div className="flex shrink-0 gap-2">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </button>
                      {/* admins already have a delete button in their panel */}
                      {!isAdmin && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm text-red-600 hover:bg-red-50"
                          onClick={() => setConfirmDelete(true)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{ticket.description}</p>

                {isOwner && !isOpen && !isAdmin && (
                  <p className="mt-5 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    This ticket is {enumLabel(ticket.status).toLowerCase()}, so it can no longer be edited or deleted. You can still
                    {ticket.status === 'closed' ? ' read the conversation.' : ' add comments.'}
                  </p>
                )}
              </>
            )}
          </article>

          <CommentThread
            ticketId={ticket.id}
            comments={comments}
            closed={ticket.status === 'closed'}
            onCommentAdded={() => refreshAfterAction('Comment added')}
          />
        </div>

        {/* right column: admin panel, details, activity */}
        <aside className="space-y-6">
          {isAdmin && (
            <AdminTicketPanel
              key={`${ticket.status}-${ticket.priority}`} // resets the selects when the ticket changes
              ticket={ticket}
              onUpdated={(updated, message) => {
                setTicket(updated);
                return refreshAfterAction(message);
              }}
              onDeleteClick={() => setConfirmDelete(true)}
            />
          )}

          <section className="card p-5">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">Details</h2>
            <dl className="divide-y divide-slate-100">
              <DetailRow label="Raised by">{ticket.createdBy?.name || '—'}</DetailRow>
              {isAdmin && ticket.createdBy?.email && (
                <DetailRow label="Email">
                  <span className="break-all">{ticket.createdBy.email}</span>
                </DetailRow>
              )}
              <DetailRow label="Created">{formatDateTime(ticket.createdAt)}</DetailRow>
              <DetailRow label="Last updated">{formatDateTime(ticket.updatedAt)}</DetailRow>
              {ticket.resolvedAt && <DetailRow label="Resolved">{formatDateTime(ticket.resolvedAt)}</DetailRow>}
            </dl>
          </section>

          <section className="card p-5" aria-labelledby="activity-heading">
            <h2 id="activity-heading" className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <History className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Activity
            </h2>
            <ActivityTimeline activity={activity} />
          </section>
        </aside>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title={`Delete ticket #${ticket.ticketNumber}?`}
        message="The ticket and all of its comments will be removed. This cannot be undone."
        confirmLabel="Delete ticket"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
