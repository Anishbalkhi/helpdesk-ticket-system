// Formatting helpers shared by every page.

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });

const relativeFormatter = new Intl.RelativeTimeFormat('en-IN', { numeric: 'auto' });

/** "26 Nov 2026, 3:35 pm" */
export function formatDateTime(value) {
  if (!value) return '';
  return dateTimeFormatter.format(new Date(value));
}

/** "26 Nov 2026" */
export function formatDate(value) {
  if (!value) return '';
  return dateFormatter.format(new Date(value));
}

/** "5 minutes ago", "yesterday", ... (falls back to the full date after a week) */
export function timeAgo(value) {
  if (!value) return '';
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);

  if (abs < 45) return 'just now';
  if (abs < 3600) return relativeFormatter.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return relativeFormatter.format(Math.round(seconds / 3600), 'hour');
  if (abs < 604800) return relativeFormatter.format(Math.round(seconds / 86400), 'day');
  return formatDate(value);
}

// Enum values that need a special label. Everything else is turned from
// snake_case into "Sentence case" automatically.
const SPECIAL_LABELS = {
  in_progress: 'In progress',
  feature_request: 'Feature request',
};

/** "in_progress" -> "In progress", "high" -> "High" */
export function enumLabel(value) {
  if (!value) return '';
  if (SPECIAL_LABELS[value]) return SPECIAL_LABELS[value];
  const text = String(value).replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function truncate(text, max = 80) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
