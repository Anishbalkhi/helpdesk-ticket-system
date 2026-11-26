// Enum values exactly as the API defines them (see docs/API.md).
export const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const CATEGORIES = ['technical', 'billing', 'account', 'feature_request', 'other'];

export const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: '-updatedAt', label: 'Recently updated' },
  { value: 'updatedAt', label: 'Least recently updated' },
  { value: '-priority', label: 'Priority: urgent first' },
  { value: 'priority', label: 'Priority: low first' },
];

export const DEFAULT_SORT = '-createdAt';
export const PAGE_SIZE = 10;

// Tailwind classes for the coloured badges.
export const STATUS_STYLES = {
  open: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  in_progress: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  resolved: 'bg-green-50 text-green-700 ring-green-600/20',
  closed: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export const PRIORITY_STYLES = {
  low: 'bg-slate-50 text-slate-600 ring-slate-500/20',
  medium: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  high: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  urgent: 'bg-red-50 text-red-700 ring-red-600/20',
};

export const ROLE_STYLES = {
  admin: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  user: 'bg-slate-50 text-slate-600 ring-slate-500/20',
};

// Solid colours for the dashboard bar charts.
export const PRIORITY_BAR_COLORS = {
  low: 'bg-slate-400',
  medium: 'bg-sky-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};
