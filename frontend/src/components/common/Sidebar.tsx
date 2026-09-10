import React from 'react';
import { LayoutDashboard, Box, TrendingUp, History, Settings, Anchor } from 'lucide-react';
import { NavigationPage } from '../../types';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const navItems: { id: NavigationPage; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'cargo', label: 'Cargo', icon: <Box size={18} /> },
    { id: 'market', label: 'Market', icon: <TrendingUp size={18} /> },
    { id: 'history', label: 'History', icon: <History size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="w-64 bg-[#1B2028] text-white flex flex-col fixed inset-y-0 left-0 z-30 select-none border-r border-[#262D38]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#262D38]/60 flex items-start gap-3">
        <div className="p-1.5 bg-[#262D38] rounded text-slate-200 mt-0.5">
          <Anchor size={18} className="text-slate-100" />
        </div>
        <div>
          <h1 className="font-mono font-bold text-sm tracking-wider text-white uppercase">
            SAIL FREIGHT
          </h1>
          <p className="font-mono text-[10px] text-[#B9C3CF] tracking-widest uppercase">
            Intelligence Terminal
          </p>
        </div>
      </div>

      {/* Scope Subtitle */}
      <div className="px-5 pt-4 pb-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#6C7A89] font-medium">
          Corridor // East Coast India
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-1 mt-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all text-left ${
                isActive
                  ? 'bg-[#262D38] text-white border-l-2 border-white shadow-sm'
                  : 'text-[#B9C3CF] hover:bg-[#22272E] hover:text-white'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-[#6C7A89]'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Operational Status */}
      <div className="p-4 border-t border-[#262D38]/60">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[11px] font-semibold text-slate-200 uppercase tracking-wide">
              Baltic Active
            </div>
            <div className="font-mono text-[9px] text-[#6C7A89] uppercase">
              C5 / C3 Indexed
            </div>
          </div>
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-300"></span>
          </div>
        </div>
      </div>
    </aside>
  );
};
