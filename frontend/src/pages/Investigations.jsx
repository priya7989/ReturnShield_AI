import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReturns } from '../services/api';
import StatusBadge, { RiskBadge } from '../components/StatusBadge';
import { Search, Filter, FolderSearch, RefreshCw, PlusCircle, Calendar } from 'lucide-react';

export const Investigations = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const navigate = useNavigate();

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await getReturns();
      setCases(data);
    } catch (err) {
      console.error("Error fetching cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // Filter cases
  const filteredCases = cases.filter(c => {
    const matchesSearch =
      c.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.order?.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.order?.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesRisk = riskFilter === 'ALL' || c.risk_level === riskFilter;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderSearch className="w-6 h-6 text-cyan-400" />
            Return Investigations Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Comprehensive audit table of all submitted e-commerce return claims
          </p>
        </div>
        <button
          onClick={() => navigate('/new-investigation')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-cyan-500/20"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          New Investigation
        </button>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        {/* Search input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Case ID, Customer, Order #, Product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Needs Human Review">Needs Human Review</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
            <option value="Unassessed">Unassessed</option>
          </select>

          <button
            onClick={fetchCases}
            title="Refresh"
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading return cases...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No return cases matching your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">Case ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Order #</th>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Return Reason</th>
                  <th className="px-6 py-4">Risk Level</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
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
                    <td className="px-6 py-4 text-slate-400 flex items-center gap-1.5 mt-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/investigations/${c.id}`)}
                        className="px-3.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 font-bold transition-all border border-cyan-500/30"
                      >
                        Inspect Case
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

export default Investigations;
