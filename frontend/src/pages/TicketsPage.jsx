import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, SearchX } from 'lucide-react';
import { getTickets } from '../api/tickets';
import { parseApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import { DEFAULT_SORT, PAGE_SIZE } from '../utils/constants';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { PageLoader } from '../components/Spinner';
import TicketFilters from '../components/TicketFilters';
import TicketListItem from '../components/TicketListItem';

/**
 * Users see "My tickets", admins see "All tickets" (the API decides which).
 *
 * Filters live in the URL (?status=open&page=2 …) so a refresh, the back
 * button or a shared link keeps the same view.
 */
export default function TicketsPage() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // read the current filters from the URL
  const filters = {
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || DEFAULT_SORT,
  };
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [searchText, setSearchText] = useState(search);
  const debouncedSearch = useDebounce(searchText, 400);

  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // one-time message passed by another page (e.g. "Ticket #12 deleted")
  const [flash, setFlash] = useState(location.state?.flash || '');
  useEffect(() => {
    if (location.state?.flash) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, []);

  /** Change some URL params. Any filter change sends you back to page 1. */
  function updateParams(changes, { resetPage = true } = {}) {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) next.delete(key);
      else next.set(key, String(value));
    });
    if (resetPage) next.delete('page');
    if (next.get('sort') === DEFAULT_SORT) next.delete('sort'); // keep the URL short
    setSearchParams(next, { replace: true });
  }

  // when the debounced search text changes, put it in the URL
  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed !== search) updateParams({ search: trimmed });
  }, [debouncedSearch]);

  // fetch tickets whenever the URL params change
  const queryKey = searchParams.toString();
  useEffect(() => {
    let cancelled = false; // ignore responses that arrive after a newer request
    setLoading(true);
    setError('');

    getTickets({ ...filters, search, page, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        // e.g. the last ticket on the last page was deleted -> go to the new last page
        if (data.pagination.totalPages > 0 && page > data.pagination.totalPages) {
          updateParams({ page: data.pagination.totalPages }, { resetPage: false });
          return;
        }
        setTickets(data.tickets);
        setPagination(data.pagination);
      })
      .catch((err) => {
        if (!cancelled) setError(parseApiError(err).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [queryKey]);

  const hasActiveFilters = Boolean(filters.status || filters.priority || filters.category || search);

  function resetFilters() {
    setSearchText('');
    setSearchParams({}, { replace: true });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{isAdmin ? 'All tickets' : 'My tickets'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin ? 'Every ticket raised by every user.' : 'Tickets you have raised with the support team.'}
          </p>
        </div>
        <Link to="/tickets/new" className="btn btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New ticket
        </Link>
      </div>

      <Alert variant="success" onClose={() => setFlash('')}>
        {flash}
      </Alert>

      <TicketFilters
        searchText={searchText}
        onSearchChange={setSearchText}
        filters={filters}
        onFilterChange={(name, value) => updateParams({ [name]: value })}
        onReset={resetFilters}
        canReset={hasActiveFilters}
      />

      <div className="card overflow-hidden">
        {error ? (
          <div className="p-4">
            <Alert>{error}</Alert>
          </div>
        ) : loading && !pagination ? (
          <PageLoader label="Loading tickets…" />
        ) : tickets.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              icon={SearchX}
              title="No tickets match your filters"
              description="Try a different search term or clear the filters."
              action={
                <button type="button" className="btn btn-secondary" onClick={resetFilters}>
                  Clear filters
                </button>
              }
            />
          ) : (
            <EmptyState
              title="No tickets yet"
              description={isAdmin ? 'When users raise tickets they will show up here.' : 'Raise a ticket and our support team will get back to you.'}
              action={
                !isAdmin && (
                  <Link to="/tickets/new" className="btn btn-primary">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Raise a ticket
                  </Link>
                )
              }
            />
          )
        ) : (
          <div className={loading ? 'pointer-events-none opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={loading}>
            <ul className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <TicketListItem key={ticket.id} ticket={ticket} showSubmitter={isAdmin} />
              ))}
            </ul>
            <Pagination pagination={pagination} onPageChange={(newPage) => updateParams({ page: newPage }, { resetPage: false })} />
          </div>
        )}
      </div>
    </div>
  );
}
