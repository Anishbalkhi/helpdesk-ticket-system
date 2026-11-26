import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createTicket } from '../api/tickets';
import TicketForm from '../components/TicketForm';

export default function NewTicketPage() {
  const navigate = useNavigate();

  async function handleCreate(values) {
    const ticket = await createTicket(values);
    navigate(`/tickets/${ticket.id}`, { state: { flash: `Ticket #${ticket.ticketNumber} created` } });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/tickets" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to tickets
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">New ticket</h1>
        <p className="mt-1 text-sm text-slate-500">Tell us what is wrong. New tickets start with the status “Open”.</p>
      </div>

      <div className="card p-5 sm:p-6">
        <TicketForm submitLabel="Create ticket" onSubmit={handleCreate} onCancel={() => navigate('/tickets')} />
      </div>
    </div>
  );
}
