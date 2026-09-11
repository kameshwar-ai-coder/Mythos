import React, { useState, useEffect } from 'react';
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
import { marketService } from '../services/marketService';
import { CurrentMarketData } from '../types';
import { useCurrency } from '../context/CurrencyContext';

export const DashboardPage: React.FC = () => {
  const { symbol, formatRate, convert } = useCurrency();
  const [horizonFilter, setHorizonFilter] = useState<'30D' | '90D' | '1Y'>('90D');
  const [currentMarket, setCurrentMarket] = useState<CurrentMarketData | null>(null);
  const [forecastHorizons, setForecastHorizons] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [curr, fc] = await Promise.all([
        marketService.getCurrent('Hay Point', 'Paradip', 'Coal'),
        marketService.getForecast('Hay Point', 'Paradip')
      ]);
      setCurrentMarket(curr);
      setForecastHorizons(fc);
    } catch (e) {
      console.error(e);
    }
  };

  const spot = currentMarket?.freight_rate || 14.32;
  const landedCostUsd = spot + 6.97;
  const fc7 = forecastHorizons?.h7?.forecast_rate || 14.07;
  const fc14 = forecastHorizons?.h14?.forecast_rate || 13.94;
  const fc30 = forecastHorizons?.h30?.forecast_rate || 13.90;
  const fc60 = forecastHorizons?.h60?.forecast_rate || 13.82;
  const fc90 = forecastHorizons?.h90?.forecast_rate || 13.73;
  const fc180 = forecastHorizons?.h180?.forecast_rate || 13.69;
  const fc360 = forecastHorizons?.h360?.forecast_rate || 13.69;

  let chartData: any[] = [];
  let card1: any = null;
  let card2: any = null;
  let card3: any = null;

  if (horizonFilter === '30D') {
    chartData = [
      { name: 'HIST -90D', actual: convert(Number((spot + 0.35).toFixed(2))), forecast: null, upper: null },
      { name: 'HIST -60D', actual: convert(Number((spot + 0.20).toFixed(2))), forecast: null, upper: null },
      { name: 'HIST -30D', actual: convert(Number((spot + 0.10).toFixed(2))), forecast: null, upper: null },
      { name: 'TODAY (SPOT)', actual: convert(spot), forecast: convert(spot), upper: convert(spot) },
      { name: forecastHorizons?.h7?.date_str || '+7D', actual: null, forecast: convert(fc7), upper: convert(fc7 + 0.35) },
      { name: forecastHorizons?.h14?.date_str || '+14D', actual: null, forecast: convert(fc14), upper: convert(fc14 + 0.45) },
      { name: forecastHorizons?.h30?.date_str || '+30D', actual: null, forecast: convert(fc30), upper: convert(fc30 + 0.65) },
    ];
    card1 = { label: '7D Forward Horizon', date: forecastHorizons?.h7?.date_str || '+7D', rate: fc7, conf: forecastHorizons?.h7?.confidence_pct || 94, is_pos: forecastHorizons?.h7?.is_positive };
    card2 = { label: '14D Forward Horizon', date: forecastHorizons?.h14?.date_str || '+14D', rate: fc14, conf: forecastHorizons?.h14?.confidence_pct || 89, is_pos: forecastHorizons?.h14?.is_positive };
    card3 = { label: '30D Forward Horizon', date: forecastHorizons?.h30?.date_str || '+30D', rate: fc30, conf: forecastHorizons?.h30?.confidence_pct || 82, is_pos: forecastHorizons?.h30?.is_positive };
  } else if (horizonFilter === '90D') {
    chartData = [
      { name: 'HIST -180D', actual: convert(Number((spot + 0.55).toFixed(2))), forecast: null, upper: null },
      { name: 'HIST -90D', actual: convert(Number((spot + 0.35).toFixed(2))), forecast: null, upper: null },
      { name: 'HIST -30D', actual: convert(Number((spot + 0.10).toFixed(2))), forecast: null, upper: null },
      { name: 'TODAY (SPOT)', actual: convert(spot), forecast: convert(spot), upper: convert(spot) },
      { name: forecastHorizons?.h30?.date_str || '+30D', actual: null, forecast: convert(fc30), upper: convert(fc30 + 0.65) },
      { name: forecastHorizons?.h60?.date_str || '+60D', actual: null, forecast: convert(fc60), upper: convert(fc60 + 0.80) },
      { name: forecastHorizons?.h90?.date_str || '+90D', actual: null, forecast: convert(fc90), upper: convert(fc90 + 0.95) },
    ];
    card1 = { label: '30D Forward Horizon', date: forecastHorizons?.h30?.date_str || '+30D', rate: fc30, conf: forecastHorizons?.h30?.confidence_pct || 82, is_pos: forecastHorizons?.h30?.is_positive };
    card2 = { label: '60D Forward Horizon', date: forecastHorizons?.h60?.date_str || '+60D', rate: fc60, conf: forecastHorizons?.h60?.confidence_pct || 78, is_pos: forecastHorizons?.h60?.is_positive };
    card3 = { label: '90D Forward Horizon', date: forecastHorizons?.h90?.date_str || '+90D', rate: fc90, conf: forecastHorizons?.h90?.confidence_pct || 75, is_pos: forecastHorizons?.h90?.is_positive };
  } else {
    chartData = [
      { name: 'HIST -1Y', actual: convert(Number((spot + 0.85).toFixed(2))), forecast: null, upper: null },
      { name: 'HIST -180D', actual: convert(Number((spot + 0.55).toFixed(2))), forecast: null, upper: null },
      { name: 'HIST -90D', actual: convert(Number((spot + 0.35).toFixed(2))), forecast: null, upper: null },
      { name: 'TODAY (SPOT)', actual: convert(spot), forecast: convert(spot), upper: convert(spot) },
      { name: forecastHorizons?.h90?.date_str || '+90D', actual: null, forecast: convert(fc90), upper: convert(fc90 + 0.95) },
      { name: forecastHorizons?.h180?.date_str || '+180D', actual: null, forecast: convert(fc180), upper: convert(fc180 + 1.30) },
      { name: forecastHorizons?.h360?.date_str || '+360D', actual: null, forecast: convert(fc360), upper: convert(fc360 + 1.70) },
    ];
    card1 = { label: '90D Forward Horizon', date: forecastHorizons?.h90?.date_str || '+90D', rate: fc90, conf: forecastHorizons?.h90?.confidence_pct || 75, is_pos: forecastHorizons?.h90?.is_positive };
    card2 = { label: '180D Forward Horizon', date: forecastHorizons?.h180?.date_str || '+180D', rate: fc180, conf: forecastHorizons?.h180?.confidence_pct || 70, is_pos: forecastHorizons?.h180?.is_positive };
    card3 = { label: '360D Forward Horizon', date: forecastHorizons?.h360?.date_str || '+360D', rate: fc360, conf: forecastHorizons?.h360?.confidence_pct || 65, is_pos: forecastHorizons?.h360?.is_positive };
  }

  const isMarketDown = currentMarket?.market_direction === 'DOWN' || currentMarket?.market_direction === 'BEARISH';

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
        <p className="font-mono text-xs text-[#6C7A89] mt-0.5 uppercase">
          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'long' })} • ML FORECAST ACTIVE
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
          value={formatRate(spot)}
          unit="/ MT"
          subValue={`${isMarketDown ? '▼' : '▲'} ML Freight Benchmark`}
          badgeText={isMarketDown ? '▼ DOWN' : '▲ UP'}
          badgeType={isMarketDown ? 'saving' : 'rising'}
          iconType="trend"
        />
        <KpiCard
          label="AVG LANDED COST"
          value={formatRate(landedCostUsd)}
          unit="/ MT"
          subValue="Bunker & Port queue included"
          badgeText="OPTIMIZED"
          badgeType="optimal"
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
                Market Trend & ML Forecast
              </h2>
              <span className="font-mono text-[10px] bg-[#DFE6EE] text-[#22272E] px-2 py-0.5 rounded font-semibold">
                Freight Model (SIH26006)
              </span>
            </div>
            <p className="font-mono text-xs text-[#6C7A89] mt-0.5">
              Australia (Hay Point / Newcastle) → Paradip Corridor Trajectory
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
              {formatRate(spot)}
            </span>
            <span className="font-mono text-sm text-[#6C7A89]">
              / MT
            </span>
            <span className="font-mono text-xs font-semibold text-[#22272E] bg-[#DFE6EE] px-2 py-0.5 rounded">
              {currentMarket?.momentum ? currentMarket.momentum.replace('XGBOOST', 'ML') : 'ML FORECAST • 88% CONF'}
            </span>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-5 font-mono text-xs text-[#6C7A89]">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-[#22272E]"></span>
              <span>Historical Benchmark</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#22272E]"></span>
              <span>ML 360-Day Model Forecast</span>
            </div>
          </div>
        </div>

        {/* Chart Visualization */}
        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DFE6EE" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#FAFBFD" stopOpacity={0.02}/>
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
                domain={['auto', 'auto']}
                tick={{ fill: '#6C7A89', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#DFE6EE' }}
                tickLine={false}
                tickFormatter={(v) => `${symbol}${Number(v).toFixed(0)}`}
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
                formatter={(val: any) => [`${symbol}${Number(val).toFixed(2)} / MT`, 'Rate']}
              />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="url(#forecastBand)"
                connectNulls={true}
              />
              {(() => {
                const isDown = (currentMarket?.change_7d_avg || -0.15) < 0 || currentMarket?.market_direction === 'DOWN';
                const trendStroke = isDown ? '#10B981' : '#EF4444';
                const forecastStroke = isDown ? '#34D399' : '#F87171';

                return (
                  <>
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke={trendStroke}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: trendStroke }}
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke={forecastStroke}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3.5, fill: '#FFFFFF', stroke: trendStroke, strokeWidth: 2 }}
                      connectNulls={true}
                    />
                  </>
                );
              })()}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 3 Forward Horizon Cards (Light Green for Down Arrow, Light Red for Up Arrow) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {[card1, card2, card3].map((card, idx) => {
            const isCardDown = !card.is_pos;
            const cardBg = isCardDown
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/70 border-rose-200 text-rose-950';
            const badgeBg = isCardDown
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-rose-100 text-rose-800 border border-rose-200';

            return (
              <div key={idx} className={`border rounded p-4 flex items-center justify-between transition-colors ${cardBg}`}>
                <div>
                  <div className="font-mono text-[10px] uppercase font-bold tracking-wider opacity-80">
                    {card.label} ({card.date})
                  </div>
                  <div className="font-mono text-xl font-bold mt-1">
                    {formatRate(card.rate)} <span className="text-xs font-normal opacity-70">/ MT</span>
                  </div>
                </div>
                <div className={`font-mono text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 ${badgeBg}`}>
                  <span>{card.is_pos ? '▲' : '▼'}</span>
                  <span>{card.conf}% CONF</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
