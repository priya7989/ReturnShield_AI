import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, LayoutDashboard, FolderSearch, PlusCircle, Sparkles } from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/investigations', label: 'Investigations', icon: FolderSearch },
    { path: '/new-investigation', label: 'New Investigation', icon: PlusCircle },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">
            <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
              ReturnShield <span className="text-cyan-400">AI</span>
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Investigation Core
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
            Main Operations
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 stroke-[2]" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Banner */}
      <div className="p-4 m-4 rounded-xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 mb-1">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          Autonomous Agents
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Step 1 active. Multi-agent AI engine integration ready for Step 2.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
