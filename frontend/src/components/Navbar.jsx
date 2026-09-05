import React, { useEffect, useState } from 'react';
import { getHealthStatus } from '../services/api';
import { Activity, ShieldCheck, User } from 'lucide-react';

export const Navbar = ({ title = "Dashboard", subtitle = "Autonomous Returns Investigation System" }) => {
  const [health, setHealth] = useState('checking');

  useEffect(() => {
    const checkApi = async () => {
      const res = await getHealthStatus();
      setHealth(res.status);
    };
    checkApi();
    const interval = setInterval(checkApi, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-20 bg-slate-900/60 border-b border-slate-800/80 px-8 flex items-center justify-between backdrop-blur-md sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* API Health Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-xs">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 font-medium">Backend:</span>
          {health === 'healthy' ? (
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Online
            </span>
          ) : health === 'checking' ? (
            <span className="text-amber-400 font-medium">Connecting...</span>
          ) : (
            <span className="text-rose-400 font-bold">Offline</span>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-sm">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white">Investigation Ops</p>
            <p className="text-[10px] text-slate-400">Admin Supervisor</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
