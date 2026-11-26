import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Spinner } from './Spinner';

/**
 * In-app "Are you sure?" dialog (used instead of window.confirm).
 * The parent controls it with `open`, and gets `onConfirm` / `onCancel` callbacks.
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  busy = false,
  onConfirm,
  onCancel,
}) {
  // Close on Escape (unless a request is running).
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-slate-900/40" onClick={busy ? undefined : onCancel} aria-hidden="true" />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="card relative w-full max-w-md p-5"
      >
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
          </div>
          <div>
            <h2 id="confirm-title" className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {message && <p className="mt-1 text-sm text-slate-600">{message}</p>}
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy} autoFocus>
            {busy && <Spinner />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
