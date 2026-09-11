import React from 'react';
import { Bell, User, Clock } from 'lucide-react';
import { NavigationPage } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';

interface HeaderProps {
  currentPage: NavigationPage;
  titleOverride?: string;
  subTitleOverride?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, titleOverride, subTitleOverride }) => {
  const { currency, symbol } = useCurrency();
  const getHeaderInfo = () => {
    if (titleOverride) {
      return {
        scope: titleOverride,
        time: subTitleOverride || 'Tuesday, 18 Feb 2025 | UTC 08:45'
      };
    }

    switch (currentPage) {
      case 'dashboard':
        return {
          scope: 'PARADIP / VIZAG',
          time: 'Tuesday, 18 Feb 2025 | UTC 08:45'
        };
      case 'cargo':
        return {
          scope: 'TERMINAL DESK',
          time: 'CARGO REQUIREMENT // OPTIMIZATION'
        };
      case 'market':
        return {
          scope: 'Market Intelligence',
          time: 'BENCHMARK: HAY POINT → PARADIP'
        };
      case 'history':
        return {
          scope: 'Voyage History',
          time: 'CHARTER ARCHIVE'
        };
      case 'settings':
        return {
          scope: 'TERMINAL OPERATIONS',
          time: 'SYSTEM CONFIGURATION // CONSOLE PARAMETERS'
        };
    }
  };

  const info = getHeaderInfo();

  return (
    <header className="h-14 bg-white border-b border-[#DFE6EE] px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Left Context / Scope */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#22272E]">
          {info.scope}
        </span>
        <span className="text-[#DFE6EE]">|</span>
        <div className="flex items-center gap-1.5 font-mono text-xs text-[#6C7A89]">
          <Clock size={13} className="text-[#6C7A89]" />
          <span>{info.time}</span>
        </div>
      </div>

      {/* Right User & Notification Controls */}
      <div className="flex items-center gap-5">
        {/* Toggle / Notification button */}
        <button
          title="Notifications"
          className="relative p-1.5 text-[#6C7A89] hover:text-[#22272E] hover:bg-[#FAFBFD] rounded transition-colors"
        >
          <Bell size={17} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#22272E] rounded-full border border-white"></span>
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#DFE6EE]">
          <div className="hidden sm:flex items-center gap-1.5 bg-[#FAFBFD] border border-[#DFE6EE] px-2.5 py-1 rounded font-mono text-[11px] font-bold text-[#22272E]">
            <span className="text-[#6C7A89]">CURRENCY:</span>
            <span className="text-emerald-700 bg-emerald-50 px-1 rounded">{currency} ({symbol})</span>
          </div>
          <div className="text-right">
            <div className="font-medium text-xs text-[#22272E] leading-tight">
              Capt. J. Vance
            </div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-[#6C7A89]">
              Chief Charterer
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#22272E] text-white flex items-center justify-center font-bold text-xs">
            <User size={15} />
          </div>
        </div>
      </div>
    </header>
  );
};
