import { enumLabel, truncate } from './format';

// Turns one Activity entry from the API into a human readable sentence.
//
// `details` shapes (agreed with the backend):
//   ticket.created         { title, priority, category }
//   ticket.updated         { fields: [...], changes: { field: { from, to } } }  (description has no from/to)
//   ticket.status_changed  { from, to }
//   ticket.resolved        { from }
//   ticket.deleted         { title }
//   comment.added          { commentId, excerpt }
//
// Returns { action, extra } so the UI can show the main line in bold-ish text
// and an optional secondary line (e.g. the comment excerpt) underneath.

// Fields whose values are enums and should get friendly labels.
const ENUM_FIELDS = ['category', 'priority', 'status'];

function formatValue(field, value) {
  if (value === null || value === undefined || value === '') return '—';
  return ENUM_FIELDS.includes(field) ? enumLabel(value) : `"${truncate(String(value), 40)}"`;
}

function describeUpdate(details = {}) {
  const changes = details.changes || {};
  const fields = details.fields?.length ? details.fields : Object.keys(changes);

  if (fields.length === 0) return { action: 'updated the ticket', extra: '' };

  const parts = fields.map((field) => {
    const change = changes[field];
    // description edits come without from/to, so we only name the field
    if (!change) return field;
    return `${field} (${formatValue(field, change.from)} → ${formatValue(field, change.to)})`;
  });

  return { action: `updated ${parts.join(', ')}`, extra: '' };
}

export function describeActivity(entry) {
  const details = entry.details || {};

  switch (entry.event) {
    case 'ticket.created':
      return {
        action: 'created the ticket',
        extra: [
          details.title && `"${details.title}"`,
          details.category && enumLabel(details.category),
          details.priority && `${enumLabel(details.priority)} priority`,
        ]
          .filter(Boolean)
          .join(' · '),
      };

    case 'ticket.updated':
      return describeUpdate(details);

    case 'ticket.status_changed':
      return {
        action: `changed status from ${enumLabel(details.from)} → ${enumLabel(details.to)}`,
        extra: '',
      };

    case 'ticket.resolved':
      return {
        action: 'marked the ticket as resolved',
        extra: details.from ? `Was ${enumLabel(details.from)}` : '',
      };

    case 'ticket.deleted':
      return {
        action: 'deleted the ticket',
        extra: details.title ? `"${details.title}"` : '',
      };

    case 'comment.added':
      return {
        action: 'added a comment',
        extra: details.excerpt ? `"${truncate(details.excerpt, 100)}"` : '',
      };

    default:
      return { action: entry.event, extra: '' };
  }
}
