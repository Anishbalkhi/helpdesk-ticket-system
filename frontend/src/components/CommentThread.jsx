import { useState } from 'react';
import { Lock, MessageSquare, Send } from 'lucide-react';
import { addComment } from '../api/tickets';
import { parseApiError } from '../api/client';
import { validateComment } from '../utils/validation';
import { formatDateTime } from '../utils/format';
import { RoleBadge } from './Badge';
import { Spinner } from './Spinner';

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/**
 * Comments list (oldest first, as the API returns them) and the add-comment box.
 * `onCommentAdded` lets the parent refresh comments + activity.
 */
export default function CommentThread({ ticketId, comments, closed, onCommentAdded }) {
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const clientError = validateComment(body);
    if (clientError) {
      setError(clientError);
      return;
    }

    setSending(true);
    setError('');
    try {
      await addComment(ticketId, body.trim());
      setBody('');
      await onCommentAdded();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      setError(fieldErrors.body || message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="flex items-center gap-2 border-b border-slate-200 px-5 py-3 text-sm font-semibold text-slate-900">
        <MessageSquare className="h-4 w-4 text-slate-400" aria-hidden="true" />
        Comments ({comments.length})
      </h2>

      {comments.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-500">No comments yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3 px-5 py-4">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  comment.author?.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                }`}
                aria-hidden="true"
              >
                {initials(comment.author?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{comment.author?.name || 'Unknown user'}</span>
                  {comment.author?.role && <RoleBadge role={comment.author.role} />}
                  <time className="text-xs text-slate-500" dateTime={comment.createdAt}>
                    {formatDateTime(comment.createdAt)}
                  </time>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-slate-200 px-5 py-4">
        {closed ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Lock className="h-4 w-4" aria-hidden="true" />
            This ticket is closed, so no new comments can be added.
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="comment-body" className="sr-only">
              Add a comment
            </label>
            <textarea
              id="comment-body"
              rows={3}
              maxLength={2000}
              className={`input ${error ? 'input-error' : ''}`}
              placeholder="Write a comment…"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (error) setError('');
              }}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className={`text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}>{error || `${body.length}/2000`}</p>
              <button type="submit" className="btn btn-primary btn-sm" disabled={sending}>
                {sending ? <Spinner /> : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
                Comment
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
