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

export const MarketPage: React.FC = () => {
  const [originFilter, setOriginFilter] = useState<string>('ALL');
  const [destinationFilter, setDestinationFilter] = useState<string>('ALL');
  const [cargoFilter, setCargoFilter] = useState<string>('ALL');

  const [currentMarket, setCurrentMarket] = useState<CurrentMarketData | null>(null);
  const [forecastHorizons, setForecastHorizons] = useState<any>(null);
  const [historyTable, setHistoryTable] = useState<MarketHistoryItem[]>([]);

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

  const spot = currentMarket?.freight_rate || 14.85;

  const chartData = [
    { date: '25 JAN', actual: Number((spot * 0.85).toFixed(2)), forecast: null },
    { date: '30 JAN', actual: Number((spot * 0.88).toFixed(2)), forecast: null },
    { date: '04 FEB', actual: Number((spot * 0.87).toFixed(2)), forecast: null },
    { date: '09 FEB', actual: Number((spot * 0.92).toFixed(2)), forecast: null },
    { date: '14 FEB (SPOT)', actual: spot, forecast: spot },
    { date: '21 FEB (+7D)', actual: null, forecast: forecastHorizons?.h7?.forecast_rate || Number((spot * 1.04).toFixed(2)) },
    { date: '28 FEB (+14D)', actual: null, forecast: forecastHorizons?.h14?.forecast_rate || Number((spot * 1.07).toFixed(2)) },
    { date: '16 MAR (+30D)', actual: null, forecast: forecastHorizons?.h30?.forecast_rate || Number((spot * 1.11).toFixed(2)) },
  ];

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
              Freight Rate
            </div>
            <div className="flex items-baseline gap-1 my-0.5">
              <span className="font-mono text-3xl font-bold text-[#22272E]">
                ${spot.toFixed(2)}
              </span>
              <span className="font-mono text-xs text-[#6C7A89]">/ MT</span>
            </div>
            <div className="font-mono text-[10px] text-[#6C7A89]">
              ▲ +${currentMarket?.change_7d_avg.toFixed(2) || '0.35'} vs 7d avg
            </div>
          </div>

          {/* Market Direction Card */}
          <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-4 rounded flex flex-col justify-between h-[105px]">
            <div className="font-mono text-[10px] uppercase font-bold text-[#6C7A89]">
              Market Direction
            </div>
            <div className="font-mono text-2xl font-bold text-[#22272E] flex items-center gap-1.5 my-0.5">
              <span>{currentMarket?.market_direction || 'BULLISH'}</span>
              <span>{currentMarket?.market_direction === 'BULLISH' ? '▲' : (currentMarket?.market_direction === 'BEARISH' ? '▼' : '—')}</span>
            </div>
            <div className="font-mono text-[10px] text-[#6C7A89]">
              {currentMarket?.momentum || 'STRONG MOMENTUM • 88% CONF'}
            </div>
          </div>

          {/* Volatility Card */}
          <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-4 rounded flex flex-col justify-between h-[105px]">
            <div className="font-mono text-[10px] uppercase font-bold text-[#6C7A89]">
              Volatility
            </div>
            <div className="flex items-baseline gap-2 my-0.5">
              <span className="font-mono text-2xl font-bold text-[#22272E]">
                {currentMarket?.volatility_label || 'MODERATE'}
              </span>
              <span className="font-mono text-xs text-[#6C7A89] font-medium">
                {currentMarket?.volatility_pct || '4.2'}%
              </span>
            </div>
            <div className="font-mono text-[10px] text-[#6C7A89]">
              INDEX: {currentMarket?.volatility_index || '38'} / 100 • STABLE SPREAD
            </div>
          </div>
        </div>
      </div>

      {/* 02 // CHART // FREIGHT TREND & FORECAST */}
      <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
            02 // Chart // Freight Trend & Forecast
          </div>
          <div className="flex items-center gap-5 font-mono text-xs text-[#6C7A89]">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-[#22272E]"></span>
              <span>Historical Spot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#22272E]"></span>
              <span>Forecast Curve</span>
            </div>
          </div>
        </div>

        {/* Recharts Curve matching 23.png */}
        <div className="border border-[#DFE6EE] rounded p-4 bg-[#FAFBFD]">
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                  tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
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
                  formatter={(val: any) => [`$${Number(val).toFixed(2)} / MT`, 'Rate']}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#22272E" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#22272E' }}
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#22272E" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={{ r: 3.5, fill: '#FFFFFF', stroke: '#22272E', strokeWidth: 2 }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Forecast Horizons Cards */}
        <div>
          <div className="font-mono text-[10px] text-[#6C7A89] uppercase font-bold tracking-wider mb-2">
            Forecast Horizons
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 7 Day Forecast */}
            <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-4 rounded space-y-2">
              <div className="flex justify-between items-center font-mono text-[10px]">
                <span className="font-bold text-[#22272E]">7 Day Forecast</span>
                <span className="text-[#6C7A89]">{forecastHorizons?.h7?.date_str || '21 FEB 2025'}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold text-[#22272E]">
                  ${forecastHorizons?.h7?.forecast_rate.toFixed(2) || (spot + 0.55).toFixed(2)} <span className="text-xs text-[#6C7A89] font-normal">/ MT</span>
                </span>
                <span className="font-mono text-xs font-bold text-[#22272E]">
                  ▲ +${forecastHorizons?.h7?.change_usd.toFixed(2) || '0.55'} (+{forecastHorizons?.h7?.change_pct.toFixed(1) || '3.7'}%)
                </span>
              </div>
              <div className="font-mono text-[10px] text-[#6C7A89] border-t border-[#DFE6EE]/60 pt-1.5">
                RANGE: ${forecastHorizons?.h7?.range_min.toFixed(2) || (spot + 0.25).toFixed(2)} – ${forecastHorizons?.h7?.range_max.toFixed(2) || (spot + 0.80).toFixed(2)}
              </div>
            </div>

            {/* 14 Day Forecast */}
            <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-4 rounded space-y-2">
              <div className="flex justify-between items-center font-mono text-[10px]">
                <span className="font-bold text-[#22272E]">14 Day Forecast</span>
                <span className="text-[#6C7A89]">{forecastHorizons?.h14?.date_str || '28 FEB 2025'}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold text-[#22272E]">
                  ${forecastHorizons?.h14?.forecast_rate.toFixed(2) || (spot + 1.00).toFixed(2)} <span className="text-xs text-[#6C7A89] font-normal">/ MT</span>
                </span>
                <span className="font-mono text-xs font-bold text-[#22272E]">
                  ▲ +${forecastHorizons?.h14?.change_usd.toFixed(2) || '1.00'} (+{forecastHorizons?.h14?.change_pct.toFixed(1) || '6.7'}%)
                </span>
              </div>
              <div className="font-mono text-[10px] text-[#6C7A89] border-t border-[#DFE6EE]/60 pt-1.5">
                RANGE: ${forecastHorizons?.h14?.range_min.toFixed(2) || (spot + 0.55).toFixed(2)} – ${forecastHorizons?.h14?.range_max.toFixed(2) || (spot + 1.35).toFixed(2)}
              </div>
            </div>

            {/* 30 Day Forecast */}
            <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-4 rounded space-y-2">
              <div className="flex justify-between items-center font-mono text-[10px]">
                <span className="font-bold text-[#22272E]">30 Day Forecast</span>
                <span className="text-[#6C7A89]">{forecastHorizons?.h30?.date_str || '16 MAR 2025'}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold text-[#22272E]">
                  ${forecastHorizons?.h30?.forecast_rate.toFixed(2) || (spot + 1.65).toFixed(2)} <span className="text-xs text-[#6C7A89] font-normal">/ MT</span>
                </span>
                <span className="font-mono text-xs font-bold text-[#22272E]">
                  ▲ +${forecastHorizons?.h30?.change_usd.toFixed(2) || '1.65'} (+{forecastHorizons?.h30?.change_pct.toFixed(1) || '11.1'}%)
                </span>
              </div>
              <div className="font-mono text-[10px] text-[#6C7A89] border-t border-[#DFE6EE]/60 pt-1.5">
                RANGE: ${forecastHorizons?.h30?.range_min.toFixed(2) || (spot + 0.95).toFixed(2)} – ${forecastHorizons?.h30?.range_max.toFixed(2) || (spot + 2.30).toFixed(2)}
              </div>
            </div>
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
                  <td className="py-2.5 px-4 font-bold text-[#22272E]">${row.rate_per_mt.toFixed(2)}</td>
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
