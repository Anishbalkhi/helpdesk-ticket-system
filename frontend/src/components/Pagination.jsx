import { ChevronLeft, ChevronRight } from 'lucide-react';

/** "Showing 11–20 of 23" + Previous / Next buttons. */
export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.total === 0) return null;

  const { page, limit, total, totalPages } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav
      className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row"
      aria-label="Pagination"
    >
      <p className="text-sm text-slate-600">
        Showing <span className="font-medium">{from}</span>–<span className="font-medium">{to}</span> of{' '}
        <span className="font-medium">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </button>
        <span className="px-1 text-sm text-slate-600">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
