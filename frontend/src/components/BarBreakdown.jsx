import { enumLabel } from '../utils/format';

/**
 * Horizontal bar chart made of plain divs (no chart library).
 *
 * @param {string[]} keys        enum values, in the order to show them
 * @param {object}   counts      { key: number } from the API
 * @param {object}   colors      { key: 'bg-…' } Tailwind classes (optional)
 */
export default function BarBreakdown({ title, keys, counts = {}, colors = {} }) {
  const total = keys.reduce((sum, key) => sum + (counts[key] || 0), 0);

  return (
    <section className="card p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
      <ul className="space-y-3">
        {keys.map((key) => {
          const count = counts[key] || 0;
          const percent = total ? Math.round((count / total) * 100) : 0;
          return (
            <li key={key}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-700">{enumLabel(key)}</span>
                <span className="text-slate-500">
                  {count} <span className="text-xs">({percent}%)</span>
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label={enumLabel(key)}
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-full transition-all ${colors[key] || 'bg-indigo-500'}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
