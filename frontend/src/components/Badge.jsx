import { PRIORITY_STYLES, ROLE_STYLES, STATUS_STYLES } from '../utils/constants';
import { enumLabel } from '../utils/format';

/** Generic pill. `className` carries the colour classes. */
export function Badge({ className = '', children }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  return <Badge className={STATUS_STYLES[status]}>{enumLabel(status)}</Badge>;
}

export function PriorityBadge({ priority }) {
  return <Badge className={PRIORITY_STYLES[priority]}>{enumLabel(priority)}</Badge>;
}

export function RoleBadge({ role }) {
  return <Badge className={ROLE_STYLES[role]}>{enumLabel(role)}</Badge>;
}

export function CategoryBadge({ category }) {
  return <Badge className="bg-white text-slate-600 ring-slate-300">{enumLabel(category)}</Badge>;
}
