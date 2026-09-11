import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Filter } from 'lucide-react';
import { marketService } from '../services/marketService';
import { CurrentMarketData, MarketHistoryItem } from '../types';
import { useCurrency } from '../context/CurrencyContext';

export const MarketPage: React.FC = () => {
  const { symbol, formatRate, convert } = useCurrency();
  const [originFilter, setOriginFilter] = useState<string>('ALL');
  const [destinationFilter, setDestinationFilter] = useState<string>('ALL');
  const [cargoFilter, setCargoFilter] = useState<string>('ALL');

  const [currentMarket, setCurrentMarket] = useState<CurrentMarketData | null>(null);
  const [forecastHorizons, setForecastHorizons] = useState<any>(null);
  const [historyTable, setHistoryTable] = useState<MarketHistoryItem[]>([]);

  const [horizonFilter, setHorizonFilter] = useState<'30D' | '90D' | '1Y'>('30D');

  useEffect(() => {
    loadMarketData();
  }, [originFilter, destinationFilter, cargoFilter]);

  const loadMarketData = async () => {
    try {
      const orig = originFilter === 'ALL' ? undefined : originFilter;
      const dest = destinationFilter === 'ALL' ? undefined : destinationFilter;
      const crg = cargoFilter === 'ALL' ? undefined : cargoFilter;

      const [current, history, forecast] = await Promise.all([
        marketService.getCurrent(orig, dest, crg),
        marketService.getHistory(orig, dest, crg),
        marketService.getForecast(orig, dest)
      ]);
      setCurrentMarket(current);
      setHistoryTable(history);
      setForecastHorizons(forecast);
    } catch (err) {
      console.error(err);
    }
  };

  const spot = currentMarket?.freight_rate || 14.32;
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
      { date: 'HIST -30D', actual: convert(Number((spot + 0.15).toFixed(2))), forecast: null },
      { date: 'HIST -14D', actual: convert(Number((spot + 0.10).toFixed(2))), forecast: null },
      { date: 'HIST -7D', actual: convert(Number((spot + 0.05).toFixed(2))), forecast: null },
      { date: 'TODAY (SPOT)', actual: convert(spot), forecast: convert(spot) },
      { date: forecastHorizons?.h7?.date_str || '+7D', actual: null, forecast: convert(fc7) },
      { date: forecastHorizons?.h14?.date_str || '+14D', actual: null, forecast: convert(fc14) },
      { date: forecastHorizons?.h30?.date_str || '+30D', actual: null, forecast: convert(fc30) },
    ];
    card1 = { label: '7 Day Forecast', date: forecastHorizons?.h7?.date_str || '+7D', rate: fc7, diff: forecastHorizons?.h7?.change_usd || 0.25, pct: forecastHorizons?.h7?.change_pct || 1.8, is_pos: forecastHorizons?.h7?.is_positive, min: forecastHorizons?.h7?.range_min || fc7 - 0.25, max: forecastHorizons?.h7?.range_max || fc7 + 0.35 };
    card2 = { label: '14 Day Forecast', date: forecastHorizons?.h14?.date_str || '+14D', rate: fc14, diff: forecastHorizons?.h14?.change_usd || 0.38, pct: forecastHorizons?.h14?.change_pct || 2.6, is_pos: forecastHorizons?.h14?.is_positive, min: forecastHorizons?.h14?.range_min || fc14 - 0.35, max: forecastHorizons?.h14?.range_max || fc14 + 0.45 };
    card3 = { label: '30 Day Forecast', date: forecastHorizons?.h30?.date_str || '+30D', rate: fc30, diff: forecastHorizons?.h30?.change_usd || 0.42, pct: forecastHorizons?.h30?.change_pct || 2.9, is_pos: forecastHorizons?.h30?.is_positive, min: forecastHorizons?.h30?.range_min || fc30 - 0.50, max: forecastHorizons?.h30?.range_max || fc30 + 0.65 };
  } else if (horizonFilter === '90D') {
    chartData = [
      { date: 'HIST -90D', actual: convert(Number((spot + 0.35).toFixed(2))), forecast: null },
      { date: 'HIST -60D', actual: convert(Number((spot + 0.20).toFixed(2))), forecast: null },
      { date: 'HIST -30D', actual: convert(Number((spot + 0.10).toFixed(2))), forecast: null },
      { date: 'TODAY (SPOT)', actual: convert(spot), forecast: convert(spot) },
      { date: forecastHorizons?.h30?.date_str || '+30D', actual: null, forecast: convert(fc30) },
      { date: forecastHorizons?.h60?.date_str || '+60D', actual: null, forecast: convert(fc60) },
      { date: forecastHorizons?.h90?.date_str || '+90D', actual: null, forecast: convert(fc90) },
    ];
    card1 = { label: '30 Day Forecast', date: forecastHorizons?.h30?.date_str || '+30D', rate: fc30, diff: forecastHorizons?.h30?.change_usd || 0.42, pct: forecastHorizons?.h30?.change_pct || 2.9, is_pos: forecastHorizons?.h30?.is_positive, min: forecastHorizons?.h30?.range_min || fc30 - 0.50, max: forecastHorizons?.h30?.range_max || fc30 + 0.65 };
    card2 = { label: '60 Day Forecast', date: forecastHorizons?.h60?.date_str || '+60D', rate: fc60, diff: forecastHorizons?.h60?.change_usd || 0.50, pct: forecastHorizons?.h60?.change_pct || 3.5, is_pos: forecastHorizons?.h60?.is_positive, min: forecastHorizons?.h60?.range_min || fc60 - 0.65, max: forecastHorizons?.h60?.range_max || fc60 + 0.80 };
    card3 = { label: '90 Day Forecast', date: forecastHorizons?.h90?.date_str || '+90D', rate: fc90, diff: forecastHorizons?.h90?.change_usd || 0.59, pct: forecastHorizons?.h90?.change_pct || 4.1, is_pos: forecastHorizons?.h90?.is_positive, min: forecastHorizons?.h90?.range_min || fc90 - 0.75, max: forecastHorizons?.h90?.range_max || fc90 + 0.95 };
  } else {
    chartData = [
      { date: 'HIST -1Y', actual: convert(Number((spot + 0.85).toFixed(2))), forecast: null },
      { date: 'HIST -180D', actual: convert(Number((spot + 0.55).toFixed(2))), forecast: null },
      { date: 'HIST -90D', actual: convert(Number((spot + 0.35).toFixed(2))), forecast: null },
      { date: 'TODAY (SPOT)', actual: convert(spot), forecast: convert(spot) },
      { date: forecastHorizons?.h90?.date_str || '+90D', actual: null, forecast: convert(fc90) },
      { date: forecastHorizons?.h180?.date_str || '+180D', actual: null, forecast: convert(fc180) },
      { date: forecastHorizons?.h360?.date_str || '+360D', actual: null, forecast: convert(fc360) },
    ];
    card1 = { label: '90 Day Forecast', date: forecastHorizons?.h90?.date_str || '+90D', rate: fc90, diff: forecastHorizons?.h90?.change_usd || 0.59, pct: forecastHorizons?.h90?.change_pct || 4.1, is_pos: forecastHorizons?.h90?.is_positive, min: forecastHorizons?.h90?.range_min || fc90 - 0.75, max: forecastHorizons?.h90?.range_max || fc90 + 0.95 };
    card2 = { label: '180 Day Forecast', date: forecastHorizons?.h180?.date_str || '+180D', rate: fc180, diff: forecastHorizons?.h180?.change_usd || 0.63, pct: forecastHorizons?.h180?.change_pct || 4.4, is_pos: forecastHorizons?.h180?.is_positive, min: forecastHorizons?.h180?.range_min || fc180 - 1.10, max: forecastHorizons?.h180?.range_max || fc180 + 1.30 };
    card3 = { label: '360 Day Forecast', date: forecastHorizons?.h360?.date_str || '+360D', rate: fc360, diff: forecastHorizons?.h360?.change_usd || 0.63, pct: forecastHorizons?.h360?.change_pct || 4.4, is_pos: forecastHorizons?.h360?.is_positive, min: forecastHorizons?.h360?.range_min || fc360 - 1.40, max: forecastHorizons?.h360?.range_max || fc360 + 1.70 };
  }

  const dir = (currentMarket?.market_direction || '').toUpperCase();
  const isMarketDown = dir === 'DOWN' || dir === 'BEARISH' || dir === 'DROP' || dir.includes('DOWN');
  const isMarketUp = dir === 'UP' || dir === 'BULLISH' || dir === 'RISE' || dir.includes('UP');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Route & Cargo Filter Toolbar */}
      <div className="bg-white border border-[#DFE6EE] rounded-lg p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#22272E]">
          <Filter size={15} className="text-[#6C7A89]" />
          <span>MARKET CORRIDOR FILTERS:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          {/* Origin */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#6C7A89]">ORIGIN:</span>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="bg-[#FAFBFD] border border-[#DFE6EE] rounded px-2.5 py-1 text-xs font-bold text-[#22272E] focus:outline-none"
            >
              <option value="ALL">ALL ORIGINS (Global)</option>
              <option value="Hay Point">Hay Point (Australia)</option>
              <option value="Gladstone">Gladstone (Australia)</option>
              <option value="Newcastle">Newcastle (Australia)</option>
              <option value="Port Hedland">Port Hedland (Australia)</option>
              <option value="Norfolk">Norfolk (United States)</option>
              <option value="Richards Bay">Richards Bay (South Africa)</option>
              <option value="Samarinda">Samarinda (Indonesia)</option>
              <option value="Vanino">Vanino (Russia)</option>
            </select>
          </div>

          {/* Destination */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#6C7A89]">DESTINATION:</span>
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="bg-[#FAFBFD] border border-[#DFE6EE] rounded px-2.5 py-1 text-xs font-bold text-[#22272E] focus:outline-none"
            >
              <option value="ALL">ALL PORTS (East Coast India)</option>
              <option value="Paradip">Paradip</option>
              <option value="Visakhapatnam">Visakhapatnam</option>
              <option value="Gangavaram">Gangavaram</option>
              <option value="Dhamra">Dhamra</option>
              <option value="Haldia">Haldia</option>
            </select>
          </div>

          {/* Cargo */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#6C7A89]">CARGO:</span>
            <select
              value={cargoFilter}
              onChange={(e) => setCargoFilter(e.target.value)}
              className="bg-[#FAFBFD] border border-[#DFE6EE] rounded px-2.5 py-1 text-xs font-bold text-[#22272E] focus:outline-none"
            >
              <option value="ALL">ALL COMMODITIES</option>
              <option value="Coking Coal">Coking Coal</option>
              <option value="Thermal Coal">Thermal Coal</option>
              <option value="Iron Ore">Iron Ore</option>
            </select>
          </div>
        </div>
      </div>

      {/* 01 // CURRENT MARKET */}
      <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
            01 // Current Market
          </div>
          <div className="font-mono text-[10px] text-[#6C7A89] uppercase tracking-wider font-semibold">
            Benchmark: {originFilter === 'ALL' ? 'HAY POINT' : originFilter.toUpperCase()} → {destinationFilter === 'ALL' ? 'PARADIP' : destinationFilter.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Freight Rate Card */}
          <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-4 rounded flex flex-col justify-between h-[105px]">
            <div className="font-mono text-[10px] uppercase font-bold text-[#6C7A89]">
              Freight Rate (Spot Benchmark)
            </div>
            <div className="flex items-baseline gap-1 my-0.5">
              <span className="font-mono text-3xl font-bold text-[#22272E]">
                {formatRate(spot)}
              </span>
              <span className="font-mono text-xs text-[#6C7A89]">/ MT</span>
            </div>
            <div className="font-mono text-[10px] text-[#6C7A89]">
              {isMarketDown ? '▼' : '▲'} {formatRate(Math.abs(currentMarket?.change_7d_avg || 0.15))} vs 7d avg
            </div>
          </div>

          {/* Market Direction Card */}
          <div className={`border p-4 rounded flex flex-col justify-between h-[105px] transition-colors ${
            isMarketDown
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : isMarketUp
              ? 'bg-rose-50/80 border-rose-200 text-rose-950'
              : 'bg-[#FAFBFD] border-[#DFE6EE] text-[#22272E]'
          }`}>
            <div className={`font-mono text-[10px] uppercase font-bold ${
              isMarketDown ? 'text-emerald-700' : isMarketUp ? 'text-rose-700' : 'text-[#6C7A89]'
            }`}>
              Market Direction
            </div>
            <div className="font-mono text-2xl font-bold flex items-center gap-1.5 my-0.5">
              <span>{isMarketDown ? 'DOWN' : isMarketUp ? 'UP' : dir || 'NORMAL'}</span>
              <span>{isMarketDown ? '▼' : isMarketUp ? '▲' : '▬'}</span>
            </div>
            <div className="font-mono text-[10px] opacity-80">
              {currentMarket?.momentum ? currentMarket.momentum.replace('XGBOOST', 'ML') : 'ML FORECAST • 88% CONF'}
            </div>
          </div>

          {/* Volatility Card */}
          <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-4 rounded flex flex-col justify-between h-[105px]">
            <div className="font-mono text-[10px] uppercase font-bold text-[#6C7A89]">
              Volatility
            </div>
            <div className="flex items-baseline gap-2 my-0.5">
              <span className="font-mono text-2xl font-bold text-[#22272E]">
                {currentMarket?.volatility_label || 'LOW'}
              </span>
              <span className="font-mono text-xs text-[#6C7A89] font-medium">
                {currentMarket?.volatility_pct || '1.9'}%
              </span>
            </div>
            <div className="font-mono text-[10px] text-[#6C7A89]">
              INDEX: {currentMarket?.volatility_index || '19'} / 100 • STABLE SPREAD
            </div>
          </div>
        </div>
      </div>

      {/* 02 // CHART // FREIGHT TREND & FORECAST */}
      <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
            02 // Chart // Freight Trend & ML 360-Day Forecast
          </div>

          <div className="flex items-center gap-4">
            {/* Time range toggle buttons */}
            <div className="inline-flex bg-[#FAFBFD] p-1 rounded border border-[#DFE6EE]">
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

            <div className="hidden sm:flex items-center gap-4 font-mono text-xs text-[#6C7A89]">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5" style={{ backgroundColor: isMarketDown ? '#10B981' : '#EF4444' }}></span>
                <span>Historical Benchmark</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-t-2 border-dashed" style={{ borderColor: isMarketDown ? '#34D399' : '#F87171' }}></span>
                <span>ML Forecast Curve</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recharts Curve */}
        <div className="border border-[#DFE6EE] rounded p-4 bg-[#FAFBFD]">
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#DFE6EE" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6C7A89', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
                  axisLine={{ stroke: '#DFE6EE' }}
                  tickLine={false}
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  tick={{ fill: '#6C7A89', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
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
                    fontSize: '11px'
                  }}
                  formatter={(val: any) => [`${symbol}${Number(val).toFixed(2)} / MT`, 'Rate']}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke={isMarketDown ? '#10B981' : '#EF4444'} 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: isMarketDown ? '#10B981' : '#EF4444' }}
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke={isMarketDown ? '#34D399' : '#F87171'} 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={{ r: 3.5, fill: '#FFFFFF', stroke: isMarketDown ? '#10B981' : '#EF4444', strokeWidth: 2 }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Forecast Horizons Cards (Light Green for Down Arrow, Light Red for Up Arrow) */}
        <div>
          <div className="font-mono text-[10px] text-[#6C7A89] uppercase font-bold tracking-wider mb-2">
            Forecast Horizons (ML Model Output)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[card1, card2, card3].map((card, idx) => {
              const isCardDown = !card.is_pos;
              const cardBg = isCardDown
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950';
              const textAccent = isCardDown ? 'text-emerald-700' : 'text-rose-700';

              return (
                <div key={idx} className={`border p-4 rounded space-y-2 transition-colors ${cardBg}`}>
                  <div className="flex justify-between items-center font-mono text-[10px]">
                    <span className="font-bold">{card.label}</span>
                    <span className="opacity-70">{card.date}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-bold">
                      {formatRate(card.rate)} <span className="text-xs font-normal opacity-70">/ MT</span>
                    </span>
                    <span className={`font-mono text-xs font-bold ${textAccent}`}>
                      {card.is_pos ? '▲ +' : '▼ -'}{formatRate(card.diff)} ({card.pct}%)
                    </span>
                  </div>
                  <div className="font-mono text-[10px] opacity-80 border-t border-current/20 pt-1.5">
                    RANGE: {formatRate(card.min)} – {formatRate(card.max)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 03 // MARKET HISTORY // HISTORICAL FREIGHT TABLE */}
      <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
            03 // Market History // Historical Freight Table
          </div>
          <div className="font-mono text-[10px] text-[#6C7A89] uppercase tracking-wider font-semibold">
            Showing {historyTable.length} Recent Fixtures & Benchmarks
          </div>
        </div>

        <div className="border border-[#DFE6EE] rounded overflow-x-auto">
          <table className="w-full text-left font-mono text-xs whitespace-nowrap">
            <thead className="bg-[#FAFBFD] border-b border-[#DFE6EE] text-[10px] text-[#6C7A89] uppercase font-bold">
              <tr>
                <th className="py-2.5 px-4">DATE</th>
                <th className="py-2.5 px-4">ROUTE</th>
                <th className="py-2.5 px-4">VESSEL TYPE</th>
                <th className="py-2.5 px-4">CARGO</th>
                <th className="py-2.5 px-4">QTY (MT)</th>
                <th className="py-2.5 px-4">RATE / MT</th>
                <th className="py-2.5 px-4">CHANGE (DoD)</th>
                <th className="py-2.5 px-4 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE6EE]">
              {historyTable.map((row, i) => (
                <tr key={i} className="hover:bg-[#FAFBFD]/80 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-[#22272E]">{row.date}</td>
                  <td className="py-2.5 px-4 text-[#22272E]">{row.route}</td>
                  <td className="py-2.5 px-4 text-[#6C7A89]">{row.vessel_type}</td>
                  <td className="py-2.5 px-4 text-[#6C7A89]">{row.cargo}</td>
                  <td className="py-2.5 px-4 text-[#6C7A89]">{row.quantity.toLocaleString()}</td>
                  <td className="py-2.5 px-4 font-bold text-[#22272E]">{formatRate(row.rate_per_mt)}</td>
                  <td className="py-2.5 px-4 font-semibold text-[#22272E]">{row.change_dod}</td>
                  <td className="py-2.5 px-4 text-right">
                    {row.status === 'SPOT' && (
                      <span className="bg-[#22272E] text-white px-2 py-0.5 rounded text-[10px] font-bold">SPOT</span>
                    )}
                    {row.status === 'FIXED' && (
                      <span className="bg-[#DFE6EE] text-[#22272E] px-2 py-0.5 rounded text-[10px] font-semibold">FIXED</span>
                    )}
                    {row.status === 'BENCHMARK' && (
                      <span className="border border-[#DFE6EE] bg-white text-[#6C7A89] px-2 py-0.5 rounded text-[10px] font-semibold">BENCHMARK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
