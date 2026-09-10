import React from 'react';
import { Ship, Calendar, TrendingUp, Layers, CheckSquare } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  unit?: string;
  subValue?: string;
  badgeText?: string;
  badgeType?: 'optimal' | 'active' | 'rising' | 'saving' | 'action' | 'neutral';
  iconType?: 'ship' | 'calendar' | 'trend' | 'cost' | 'decisions';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  subValue,
  badgeText,
  badgeType = 'neutral',
  iconType,
}) => {
  const renderIcon = () => {
    switch (iconType) {
      case 'ship':
        return <Ship size={15} className="text-[#6C7A89]" />;
      case 'calendar':
        return <Calendar size={15} className="text-[#6C7A89]" />;
      case 'trend':
        return <TrendingUp size={15} className="text-[#6C7A89]" />;
      case 'cost':
        return <Layers size={15} className="text-[#6C7A89]" />;
      case 'decisions':
        return <CheckSquare size={15} className="text-[#6C7A89]" />;
      default:
        return null;
    }
  };

  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'optimal':
        return 'bg-[#DFE6EE] text-[#22272E]';
      case 'active':
        return 'bg-[#DFE6EE] text-[#22272E]';
      case 'rising':
        return 'bg-[#DFE6EE] text-[#22272E]';
      case 'saving':
        return 'bg-[#DFE6EE] text-[#22272E]';
      case 'action':
        return 'bg-[#22272E] text-white';
      default:
        return 'bg-[#DFE6EE] text-[#22272E]';
    }
  };

  return (
    <div className="bg-white border border-[#DFE6EE] rounded-lg p-4 flex flex-col justify-between h-[130px] shadow-sm">
      {/* Header Label + Icon */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold text-[#6C7A89] uppercase tracking-wider">
          {label}
        </span>
        {renderIcon()}
      </div>

      {/* Main Big Number */}
      <div className="flex items-baseline gap-1 my-1">
        <span className="font-mono text-3xl font-bold text-[#22272E] tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="font-mono text-xs text-[#6C7A89] font-medium">
            {unit}
          </span>
        )}
      </div>

      {/* Footer Subtext + Badge */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#DFE6EE]/50">
        <span className="font-mono text-[11px] text-[#6C7A89] truncate">
          {subValue}
        </span>
        {badgeText && (
          <span className={`font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${getBadgeStyle()}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};
