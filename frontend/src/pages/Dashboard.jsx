import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReturns } from '../services/api';
import MetricCard from '../components/MetricCard';
import StatusBadge, { RiskBadge } from '../components/StatusBadge';
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle, ArrowRight, PlusCircle, RefreshCw } from 'lucide-react';

export const Dashboard = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReturns();
      setCases(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load investigation cases. Is the backend server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // Compute Metrics
  const total = cases.length;
  const pending = cases.filter(c => c.status === 'Pending').length;
  const approved = cases.filter(c => c.status === 'Approved').length;
  const rejected = cases.filter(c => c.status === 'Rejected').length;
  const humanReview = cases.filter(c => c.status === 'Needs Human Review').length;

  const recentCases = cases.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Operations Control Center</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time returns investigation metrics and active case monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCases}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold transition-all border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/new-investigation')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 text-xs font-extrabold transition-all shadow-lg shadow-cyan-500/20"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            New Return Request
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Cases"
          value={total}
          icon={FileText}
          color="purple"
          subtitle="All recorded claims"
        />
        <MetricCard
          title="Pending"
          value={pending}
          icon={Clock}
          color="cyan"
          subtitle="Awaiting processing"
        />
        <MetricCard
          title="Approved"
          value={approved}
          icon={CheckCircle}
          color="emerald"
          subtitle="Refund authorized"
        />
        <MetricCard
          title="Rejected"
          value={rejected}
          icon={XCircle}
          color="rose"
          subtitle="Denied / Fraud risk"
        />
        <MetricCard
          title="Human Review"
          value={humanReview}
          icon={AlertTriangle}
          color="amber"
          subtitle="Escalated to supervisor"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchCases} className="underline font-bold text-xs">Retry</button>
        </div>
      )}

      {/* Recent Investigations Table Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Recent Investigations</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest submitted e-commerce return claims</p>
          </div>
          <button
            onClick={() => navigate('/investigations')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
          >
            View All Investigations
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading recent return cases...</p>
          </div>
        ) : recentCases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No return investigation cases found. Click "New Return Request" to submit one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">Case ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Risk Level</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4 font-mono font-bold text-cyan-400">
                      {c.case_number}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {c.customer?.name || `Customer #${c.customer_id}`}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {c.order?.order_number || `#${c.order_id}`}
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate text-slate-300">
                      {c.order?.product?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-300">
                      {c.reason}
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge risk={c.risk_level} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/investigations/${c.id}`)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 font-semibold transition-all"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
