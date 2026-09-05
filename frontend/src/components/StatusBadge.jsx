import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStyle = (val) => {
    switch (val) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Needs Human Review':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Pending':
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyle(status)}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
      {status}
    </span>
  );
};

export const RiskBadge = ({ risk }) => {
  const getStyle = (val) => {
    switch (val) {
      case 'High':
        return 'bg-rose-950/60 text-rose-300 border-rose-700/50';
      case 'Medium':
        return 'bg-amber-950/60 text-amber-300 border-amber-700/50';
      case 'Low':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50';
      case 'Unassessed':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getStyle(risk)}`}>
      {risk} Risk
    </span>
  );
};

export default StatusBadge;
