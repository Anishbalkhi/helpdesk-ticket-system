import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, CheckCircle2, CircleDot, Layers, Loader, RefreshCw } from 'lucide-react';
import { getAdminStats } from '../api/admin';
import { parseApiError } from '../api/client';
import { CATEGORIES, PRIORITIES, PRIORITY_BAR_COLORS } from '../utils/constants';
import ActivityTimeline from '../components/ActivityTimeline';
import Alert from '../components/Alert';
import BarBreakdown from '../components/BarBreakdown';
import { PageLoader, Spinner } from '../components/Spinner';
import StatCard from '../components/StatCard';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStats(await getAdminStats());
    } catch (err) {
      setError(parseApiError(err, 'Could not load the dashboard.').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !stats) return <PageLoader label="Loading dashboard…" />;

  const byStatus = stats?.byStatus || {};
  const cards = [
    { label: 'Total', value: stats?.total ?? 0, icon: Layers, accent: 'bg-indigo-100 text-indigo-600', to: '/tickets' },
    { label: 'Open', value: byStatus.open ?? 0, icon: CircleDot, accent: 'bg-blue-100 text-blue-600', to: '/tickets?status=open' },
    { label: 'In progress', value: byStatus.in_progress ?? 0, icon: Loader, accent: 'bg-amber-100 text-amber-700', to: '/tickets?status=in_progress' },
    { label: 'Resolved', value: byStatus.resolved ?? 0, icon: CheckCircle2, accent: 'bg-green-100 text-green-600', to: '/tickets?status=resolved' },
    { label: 'Closed', value: byStatus.closed ?? 0, icon: Archive, accent: 'bg-slate-100 text-slate-600', to: '/tickets?status=closed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">An overview of every ticket in the system.</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
          {loading ? <Spinner /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
          Refresh
        </button>
      </div>

      <Alert>{error}</Alert>

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {cards.map(({ to, ...card }) => (
              <Link key={card.label} to={to} className="rounded-xl transition-transform hover:-translate-y-0.5">
                <StatCard {...card} />
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6">
              <BarBreakdown title="By priority" keys={PRIORITIES} counts={stats.byPriority} colors={PRIORITY_BAR_COLORS} />
              <BarBreakdown title="By category" keys={CATEGORIES} counts={stats.byCategory} />
            </div>

            <section className="card p-5 lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Recent activity</h2>
              <ActivityTimeline activity={stats.recentActivity || []} showTicket />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
