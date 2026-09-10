import React, { useState } from 'react';
import { KpiCard } from '../components/common/KpiCard';
import { 
  ResponsiveContainer, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Area, 
  ComposedChart 
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [horizonFilter, setHorizonFilter] = useState<'30D' | '90D' | '1Y'>('90D');

  const chartData = [
    { name: 'OCT 24', actual: 12.20, forecast: null, upper: null, lower: null },
    { name: 'NOV 24', actual: 12.90, forecast: null, upper: null, lower: null },
    { name: 'DEC 24', actual: 13.35, forecast: null, upper: null, lower: null },
    { name: 'JAN 25 (SPOT)', actual: 14.85, forecast: 14.85, upper: 14.85, lower: 14.85 },
    { name: 'FEB 25 (F)', actual: null, forecast: 15.65, upper: 16.40, lower: 15.10 },
    { name: 'MAR 25 (F)', actual: null, forecast: 16.20, upper: 17.30, lower: 15.40 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-mono text-2xl font-bold text-[#22272E] tracking-tight uppercase">
            Dashboard
          </h1>
          <span className="font-mono text-[10px] font-bold bg-[#DFE6EE] text-[#22272E] px-2 py-0.5 rounded uppercase tracking-wider">
            System Secure
          </span>
        </div>
        <p className="font-mono text-xs text-[#6C7A89] mt-0.5">
          18 FEB 2025 • TUESDAY • 08:45 UTC
        </p>
      </div>

      {/* Top 5 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="ACTIVE CHARTERS"
          value="08"
          subValue="5 laden • 3 ballast"
          badgeText="OPTIMAL"
          badgeType="optimal"
          iconType="ship"
        />
        <KpiCard
          label="UPCOMING VOYAGES"
          value="14"
          subValue="Next laycan T-3d"
          badgeText="ACTIVE"
          badgeType="active"
          iconType="calendar"
        />
        <KpiCard
          label="AVERAGE FREIGHT"
          value="$14.85"
          unit="/ MT"
          subValue="+$0.40 vs 7d avg"
          badgeText="▲ RISING"
          badgeType="rising"
          iconType="trend"
        />
        <KpiCard
          label="AVG LANDED COST"
          value="$21.30"
          unit="/ MT"
          subValue="-$1.45 benchmark"
          badgeText="▼ SAVING"
          badgeType="saving"
          iconType="cost"
        />
        <KpiCard
          label="OPEN DECISIONS"
          value="04"
          subValue="2 urgent fixture approvals"
          badgeText="ACTION"
          badgeType="action"
          iconType="decisions"
        />
      </div>

      {/* Main Market Trend Section */}
      <div className="bg-white border border-[#DFE6EE] rounded-lg p-6 shadow-sm space-y-6">
        {/* Trend Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#22272E]">
                Market Trend
              </h2>
              <span className="font-mono text-[10px] bg-[#DFE6EE] text-[#22272E] px-2 py-0.5 rounded font-semibold">
                Capesize 180k
              </span>
            </div>
            <p className="font-mono text-xs text-[#6C7A89] mt-0.5">
              Australia (Hay Point) → Paradip Corridor Trajectory
            </p>
          </div>

          {/* Time range buttons */}
          <div className="inline-flex bg-[#FAFBFD] p-1 rounded border border-[#DFE6EE] self-start">
            {(['30D', '90D', '1Y'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setHorizonFilter(t)}
                className={`font-mono text-xs font-semibold px-3 py-1 rounded transition-colors ${
                  horizonFilter === t
                    ? 'bg-[#22272E] text-white shadow-sm'
                    : 'text-[#6C7A89] hover:text-[#22272E]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Big Metric Banner */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 border-b border-[#DFE6EE]/60 pb-4">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-4xl font-bold text-[#22272E]">
              $14.85
            </span>
            <span className="font-mono text-sm text-[#6C7A89]">
              / MT
            </span>
            <span className="font-mono text-xs font-semibold text-[#22272E] bg-[#DFE6EE] px-2 py-0.5 rounded">
              ↗ +4.2% (14D Inflection Trajectory)
            </span>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-5 font-mono text-xs text-[#6C7A89]">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-[#22272E]"></span>
              <span>Historical (Actual)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#22272E]"></span>
              <span>Model Forecast (F)</span>
            </div>
          </div>
        </div>

        {/* Chart Visualization */}
        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DFE6EE" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#FAFBFD" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="#DFE6EE" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6C7A89', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#DFE6EE' }}
                tickLine={false}
              />
              <YAxis
                domain={[11, 18]}
                tick={{ fill: '#6C7A89', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#DFE6EE' }}
                tickLine={false}
                tickFormatter={(v) => `$${v.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#22272E',
                  border: '1px solid #DFE6EE',
                  borderRadius: '4px',
                  color: '#FAFBFD',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '12px'
                }}
                formatter={(val: any) => [`$${Number(val).toFixed(2)} / MT`, 'Rate']}
              />
              {/* Forecast upper band area */}
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="url(#forecastBand)"
                connectNulls={true}
              />
              {/* Historical actual curve */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#22272E"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#22272E' }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
              {/* Forecast curve */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#22272E"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3.5, fill: '#FFFFFF', stroke: '#22272E', strokeWidth: 2 }}
                connectNulls={true}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 3 Forward Horizon Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* 7D */}
          <div className="bg-[#FAFBFD] border border-[#DFE6EE] rounded p-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase font-bold text-[#6C7A89] tracking-wider">
                7D Forward Horizon
              </div>
              <div className="font-mono text-xl font-bold text-[#22272E] mt-1">
                $15.10 <span className="text-xs text-[#6C7A89] font-normal">/ MT</span>
              </div>
            </div>
            <div className="font-mono text-[10px] font-bold bg-[#DFE6EE] text-[#22272E] px-2 py-1 rounded flex items-center gap-1">
              <span>▲</span>
              <span>94% CONF</span>
            </div>
          </div>

          {/* 14D */}
          <div className="bg-[#FAFBFD] border border-[#DFE6EE] rounded p-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase font-bold text-[#6C7A89] tracking-wider">
                14D Forward Horizon
              </div>
              <div className="font-mono text-xl font-bold text-[#22272E] mt-1">
                $15.65 <span className="text-xs text-[#6C7A89] font-normal">/ MT</span>
              </div>
            </div>
            <div className="font-mono text-[10px] font-bold bg-[#DFE6EE] text-[#22272E] px-2 py-1 rounded flex items-center gap-1">
              <span>▲</span>
              <span>88% CONF</span>
            </div>
          </div>

          {/* 30D */}
          <div className="bg-[#FAFBFD] border border-[#DFE6EE] rounded p-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase font-bold text-[#6C7A89] tracking-wider">
                30D Forward Horizon
              </div>
              <div className="font-mono text-xl font-bold text-[#22272E] mt-1">
                $16.20 <span className="text-xs text-[#6C7A89] font-normal">/ MT</span>
              </div>
            </div>
            <div className="font-mono text-[10px] font-bold bg-[#DFE6EE] text-[#22272E] px-2 py-1 rounded flex items-center gap-1">
              <span>▲</span>
              <span>79% CONF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
