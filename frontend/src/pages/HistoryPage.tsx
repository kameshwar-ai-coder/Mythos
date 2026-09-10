import React, { useState, useEffect } from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { historyService } from '../services/historyService';
import { HistorySummaryData } from '../types';

export const HistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'active' | 'completed'>('upcoming');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [summaryData, setSummaryData] = useState<HistorySummaryData | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await historyService.getSummary();
      setSummaryData(res);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLedger = summaryData?.ledger.filter((item) => {
    if (statusFilter === 'ALL') return true;
    return item.status === statusFilter;
  }) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Filter Tabs Matching screen5.png */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setActiveTab('upcoming');
            setStatusFilter('ALL');
          }}
          className={`font-mono text-xs font-bold px-4 py-2 rounded flex items-center gap-2 transition-all ${
            activeTab === 'upcoming'
              ? 'bg-[#22272E] text-white shadow-sm'
              : 'bg-white border border-[#DFE6EE] text-[#6C7A89] hover:text-[#22272E]'
          }`}
        >
          <span>Upcoming</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeTab === 'upcoming' ? 'bg-[#3A424E]' : 'bg-[#DFE6EE] text-[#22272E]'}`}>
            {summaryData?.upcoming_count || 4}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('active');
            setStatusFilter('ACTIVE');
          }}
          className={`font-mono text-xs font-bold px-4 py-2 rounded flex items-center gap-2 transition-all ${
            activeTab === 'active'
              ? 'bg-[#22272E] text-white shadow-sm'
              : 'bg-white border border-[#DFE6EE] text-[#6C7A89] hover:text-[#22272E]'
          }`}
        >
          <span>Active</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeTab === 'active' ? 'bg-[#3A424E]' : 'bg-[#DFE6EE] text-[#22272E]'}`}>
            {summaryData?.active_count || 6}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('completed');
            setStatusFilter('COMPLETED');
          }}
          className={`font-mono text-xs font-bold px-4 py-2 rounded flex items-center gap-2 transition-all ${
            activeTab === 'completed'
              ? 'bg-[#22272E] text-white shadow-sm'
              : 'bg-white border border-[#DFE6EE] text-[#6C7A89] hover:text-[#22272E]'
          }`}
        >
          <span>Completed</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeTab === 'completed' ? 'bg-[#3A424E]' : 'bg-[#DFE6EE] text-[#22272E]'}`}>
            {summaryData?.completed_count || 32}
          </span>
        </button>
      </div>

      {/* 3 Summary Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: 01 // UPCOMING VOYAGES */}
        <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 flex flex-col justify-between shadow-sm space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase font-bold text-[#6C7A89]">
                01 // Upcoming Voyages
              </span>
              <span className="font-mono text-[9px] bg-[#FAFBFD] border border-[#DFE6EE] text-[#22272E] font-semibold px-2 py-0.5 rounded">
                FIXED & NOMINATED
              </span>
            </div>

            <div>
              <div className="font-mono text-3xl font-bold text-[#22272E]">
                680,000 <span className="text-xs font-normal text-[#6C7A89]">MT SCHEDULED</span>
              </div>
              <div className="font-mono text-xs text-[#6C7A89] mt-0.5">
                AVG COST: $14.92 / MT • 4 STEMS
              </div>
            </div>
          </div>

          {/* Mini Bar Visual */}
          <div className="border-t border-[#DFE6EE]/80 pt-3">
            <div className="flex justify-between font-mono text-[10px] text-[#6C7A89] uppercase font-bold">
              <span>SCHEDULED CAPACITY / LAYCAN WINDOW</span>
              <span className="text-[#22272E]">18 FEB - 08 MAR</span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-3 items-end h-[65px] font-mono text-[9px] text-[#6C7A89]">
              <div className="text-center space-y-1">
                <span className="block font-bold text-[#22272E]">165k</span>
                <div className="h-7 bg-[#22272E] rounded-sm"></div>
                <span>18-FEB</span>
              </div>
              <div className="text-center space-y-1">
                <span className="block font-bold text-[#22272E]">180k</span>
                <div className="h-9 bg-[#22272E] rounded-sm"></div>
                <span>24-FEB</span>
              </div>
              <div className="text-center space-y-1">
                <span className="block font-bold text-[#22272E]">165k</span>
                <div className="h-7 bg-[#B9C3CF] rounded-sm"></div>
                <span>02-MAR</span>
              </div>
              <div className="text-center space-y-1">
                <span className="block font-bold text-[#22272E]">170k</span>
                <div className="h-8 bg-[#DFE6EE] rounded-sm"></div>
                <span>08-MAR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: 02 // ACTIVE IN TRANSIT */}
        <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 flex flex-col justify-between shadow-sm space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase font-bold text-[#6C7A89]">
                02 // Active In Transit
              </span>
              <span className="font-mono text-[9px] bg-[#22272E] text-white font-bold px-2 py-0.5 rounded">
                UNDERWAY
              </span>
            </div>

            <div>
              <div className="font-mono text-3xl font-bold text-[#22272E]">
                1,025,000 <span className="text-xs font-normal text-[#6C7A89]">MT AT SEA</span>
              </div>
              <div className="font-mono text-xs text-[#6C7A89] mt-0.5">
                AVG PROGRESS: 58% • ETA ON SCHEDULE
              </div>
            </div>
          </div>

          {/* Progress Bars by Vessel */}
          <div className="border-t border-[#DFE6EE]/80 pt-3 space-y-2.5">
            <div className="flex justify-between font-mono text-[10px] text-[#6C7A89] uppercase font-bold">
              <span>VOYAGE PROGRESS BY TONNAGE</span>
              <span className="text-[#22272E]">6 VESSELS</span>
            </div>

            <div className="space-y-2 font-mono text-[10px]">
              <div>
                <div className="flex justify-between text-[#22272E] mb-1">
                  <span className="font-bold">MV PACIFIC PROSPER</span>
                  <span className="text-[#6C7A89]">88% • ETA 16-FEB</span>
                </div>
                <div className="h-1.5 w-full bg-[#DFE6EE] rounded-full overflow-hidden">
                  <div className="h-full bg-[#22272E] w-[88%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#22272E] mb-1">
                  <span className="font-bold">MV IRON LEADER</span>
                  <span className="text-[#6C7A89]">62% • ETA 19-FEB</span>
                </div>
                <div className="h-1.5 w-full bg-[#DFE6EE] rounded-full overflow-hidden">
                  <div className="h-full bg-[#6C7A89] w-[62%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#22272E] mb-1">
                  <span className="font-bold">MV GOLDEN VOYAGER</span>
                  <span className="text-[#6C7A89]">34% • ETA 22-FEB</span>
                </div>
                <div className="h-1.5 w-full bg-[#DFE6EE] rounded-full overflow-hidden">
                  <div className="h-full bg-[#B9C3CF] w-[34%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: 03 // COMPLETED FIXTURES */}
        <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 flex flex-col justify-between shadow-sm space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase font-bold text-[#6C7A89]">
                03 // Completed Fixtures
              </span>
              <span className="font-mono text-[9px] bg-[#FAFBFD] border border-[#DFE6EE] text-[#22272E] font-semibold px-2 py-0.5 rounded">
                32 DELIVERED
              </span>
            </div>

            <div>
              <div className="font-mono text-3xl font-bold text-[#22272E]">
                $14.42 <span className="text-xs font-normal text-[#6C7A89]">AVG COST / MT</span>
              </div>
              <div className="font-mono text-xs text-[#6C7A89] mt-0.5">
                TOTAL VOL: 5,420,000 MT • 100% DISCHARGED
              </div>
            </div>
          </div>

          {/* Trend Line Visual */}
          <div className="border-t border-[#DFE6EE]/80 pt-3">
            <div className="flex justify-between font-mono text-[10px] text-[#6C7A89] uppercase font-bold">
              <span>ACTUAL COST / MT SETTLEMENT TREND</span>
              <span className="text-[#22272E]">-$0.38 VS BENCHMARK</span>
            </div>

            <div className="pt-4 px-1">
              <svg className="w-full h-[45px] overflow-visible" viewBox="0 0 200 40">
                <path
                  d="M 10 30 L 65 24 L 130 18 L 190 12"
                  fill="none"
                  stroke="#22272E"
                  strokeWidth="2"
                />
                <circle cx="10" cy="30" r="3" fill="#22272E" />
                <circle cx="65" cy="24" r="3" fill="#22272E" />
                <circle cx="130" cy="18" r="3" fill="#22272E" />
                <circle cx="190" cy="12" r="3" fill="#22272E" />
              </svg>
              <div className="flex justify-between font-mono text-[9px] text-[#6C7A89] uppercase mt-1">
                <span>NOV</span>
                <span>DEC</span>
                <span>JAN</span>
                <span>FEB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VOYAGE LEDGER */}
      <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
              Voyage Ledger
            </span>
            <span className="font-mono text-[10px] text-[#6C7A89] ml-2">
              // SHOWING {filteredLedger.length} OF 42 RECORDS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="font-mono text-[10px] font-bold text-[#6C7A89] flex items-center gap-1.5">
              <span>VIEWING:</span>
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-[#22272E] text-white px-2.5 py-1 rounded text-[10px] font-bold focus:outline-none"
              >
                <option value="ALL">ALL STATUSES</option>
                <option value="UPCOMING">UPCOMING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            <button
              onClick={() => alert("Exporting full Voyage Ledger to CSV...")}
              className="font-mono text-xs font-bold bg-[#FAFBFD] hover:bg-slate-100 text-[#22272E] border border-[#DFE6EE] px-3 py-1 rounded flex items-center gap-1.5 transition-colors"
            >
              <Download size={12} />
              <span>EXPORT CSV</span>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="border border-[#DFE6EE] rounded overflow-x-auto">
          <table className="w-full text-left font-mono text-xs whitespace-nowrap">
            <thead className="bg-[#FAFBFD] border-b border-[#DFE6EE] text-[10px] text-[#6C7A89] uppercase font-bold">
              <tr>
                <th className="py-3 px-4">VOYAGE</th>
                <th className="py-3 px-4">CARGO</th>
                <th className="py-3 px-4">ROUTE</th>
                <th className="py-3 px-4">VESSEL</th>
                <th className="py-3 px-4">QUANTITY</th>
                <th className="py-3 px-4">COST / MT</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE6EE]">
              {filteredLedger.map((row, i) => (
                <tr key={i} className="hover:bg-[#FAFBFD]/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#22272E]">{row.voyage_id}</td>
                  <td className="py-3 px-4 text-[#22272E]">{row.cargo}</td>
                  <td className="py-3 px-4 text-[#6C7A89]">{row.route}</td>
                  <td className="py-3 px-4 font-semibold text-[#22272E]">{row.vessel}</td>
                  <td className="py-3 px-4 text-[#6C7A89]">{row.quantity.toLocaleString()} MT</td>
                  <td className="py-3 px-4 font-bold text-[#22272E]">${row.cost_per_mt.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    {row.status === 'UPCOMING' && (
                      <span className="bg-[#FAFBFD] border border-[#DFE6EE] text-[#22272E] px-2 py-0.5 rounded text-[10px] font-bold">UPCOMING</span>
                    )}
                    {row.status === 'ACTIVE' && (
                      <span className="bg-[#22272E] text-white px-2 py-0.5 rounded text-[10px] font-bold">ACTIVE</span>
                    )}
                    {row.status === 'COMPLETED' && (
                      <span className="bg-[#DFE6EE] text-[#6C7A89] px-2 py-0.5 rounded text-[10px] font-bold">COMPLETED</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-[#6C7A89]">{row.date_str}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ledger Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs text-[#6C7A89] pt-2">
          <span>PAGE {currentPage} OF 5 • 42 TOTAL VOYAGES RECORDED</span>
          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-[#DFE6EE] hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-7 h-7 rounded border font-bold text-xs ${
                  currentPage === num
                    ? 'bg-[#22272E] text-white border-[#22272E]'
                    : 'border-[#DFE6EE] bg-white text-[#22272E] hover:bg-slate-50'
                }`}
              >
                {num}
              </button>
            ))}
            <span className="px-1 text-[#6C7A89]">...</span>
            <button
              onClick={() => setCurrentPage(5)}
              className={`w-7 h-7 rounded border font-bold text-xs ${
                currentPage === 5
                  ? 'bg-[#22272E] text-white border-[#22272E]'
                  : 'border-[#DFE6EE] bg-white text-[#22272E] hover:bg-slate-50'
              }`}
            >
              5
            </button>
            <button
              disabled={currentPage === 5}
              onClick={() => setCurrentPage((p) => Math.min(5, p + 1))}
              className="p-1.5 rounded border border-[#DFE6EE] hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
