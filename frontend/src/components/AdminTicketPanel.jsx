import { useState } from 'react';
import { ShieldCheck, Trash2 } from 'lucide-react';
import { updateTicket } from '../api/tickets';
import { parseApiError } from '../api/client';
import { PRIORITIES, STATUSES } from '../utils/constants';
import { enumLabel } from '../utils/format';
import Alert from './Alert';
import { SelectField } from './FormField';
import { Spinner } from './Spinner';

const toOptions = (values) => values.map((value) => ({ value, label: enumLabel(value) }));

/**
 * Admin-only box on the ticket page: change status / priority, or delete.
 * Only the fields that actually changed are sent in the PATCH.
 */
export default function AdminTicketPanel({ ticket, onUpdated, onDeleteClick }) {
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const changes = {};
  if (status !== ticket.status) changes.status = status;
  if (priority !== ticket.priority) changes.priority = priority;
  const isDirty = Object.keys(changes).length > 0;

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const updated = await updateTicket(ticket.id, changes);
      await onUpdated(updated, 'Ticket updated');
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card p-5" aria-labelledby="admin-panel-heading">
      <h2 id="admin-panel-heading" className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <ShieldCheck className="h-4 w-4 text-violet-600" aria-hidden="true" />
        Admin actions
      </h2>

      <div className="space-y-3">
        <Alert onClose={() => setError('')}>{error}</Alert>
        <SelectField
          id="admin-status"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={toOptions(STATUSES)}
        />
        <SelectField
          id="admin-priority"
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          options={toOptions(PRIORITIES)}
        />

        <button type="button" className="btn btn-primary w-full" onClick={handleSave} disabled={!isDirty || saving}>
          {saving && <Spinner />}
          Save changes
        </button>

        <button type="button" className="btn btn-secondary w-full text-red-600 hover:bg-red-50" onClick={onDeleteClick}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete ticket
        </button>
      </div>
    </section>
  );
}
