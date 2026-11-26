/** Small number card on the admin dashboard. */
export default function StatCard({ label, value, icon: Icon, accent = 'bg-slate-100 text-slate-600' }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`} aria-hidden="true">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
