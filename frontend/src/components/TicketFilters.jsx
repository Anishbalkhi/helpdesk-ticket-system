import { Search, X } from 'lucide-react';
import { CATEGORIES, PRIORITIES, SORT_OPTIONS, STATUSES } from '../utils/constants';
import { enumLabel } from '../utils/format';

const toOptions = (values) => values.map((value) => ({ value, label: enumLabel(value) }));

function FilterSelect({ id, label, value, onChange, options, allLabel }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} className="input" value={value} onChange={(e) => onChange(id, e.target.value)}>
        {allLabel && <option value="">{allLabel}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Search box + filter selects. Fully controlled by the parent:
 * - `searchText` is the raw text in the box (the parent debounces it)
 * - `filters` holds status / priority / category / sort
 */
export default function TicketFilters({ searchText, onSearchChange, filters, onFilterChange, onReset, canReset }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="relative sm:col-span-2">
        <label htmlFor="search" className="sr-only">
          Search tickets
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="search"
          type="search"
          className="input pl-9"
          placeholder="Search title or description…"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <FilterSelect
        id="status"
        label="Status"
        value={filters.status}
        onChange={onFilterChange}
        options={toOptions(STATUSES)}
        allLabel="All statuses"
      />
      <FilterSelect
        id="priority"
        label="Priority"
        value={filters.priority}
        onChange={onFilterChange}
        options={toOptions(PRIORITIES)}
        allLabel="All priorities"
      />
      <FilterSelect
        id="category"
        label="Category"
        value={filters.category}
        onChange={onFilterChange}
        options={toOptions(CATEGORIES)}
        allLabel="All categories"
      />
      <FilterSelect id="sort" label="Sort by" value={filters.sort} onChange={onFilterChange} options={SORT_OPTIONS} />

      {canReset && (
        <div className="sm:col-span-2 lg:col-span-6">
          <button type="button" onClick={onReset} className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
