import api from './api';
import { HistorySummaryData, VoyageLedgerItem } from '../types';

export const historyService = {
  getSummary: async (): Promise<HistorySummaryData> => {
    try {
      const res = await api.get<HistorySummaryData>('/api/history');
      return res.data;
    } catch {
      const defaultLedger: VoyageLedgerItem[] = [
        { voyage_id: "VYG-2025-084", cargo: "Coking Coal", route: "Hay Point → Paradip", vessel: "MV Maritime Fortune", quantity: 165000, cost_per_mt: 14.85, status: "UPCOMING", date_str: "18–25 Feb 2025" },
        { voyage_id: "VYG-2025-083", cargo: "Iron Ore", route: "Port Hedland → Dhamra", vessel: "MV Ocean Pioneer", quantity: 180000, cost_per_mt: 10.20, status: "UPCOMING", date_str: "24–28 Feb 2025" },
        { voyage_id: "VYG-2025-082", cargo: "Thermal Coal", route: "Newcastle → Paradip", vessel: "MV Pacific Bulk", quantity: 165000, cost_per_mt: 15.10, status: "UPCOMING", date_str: "02–06 Mar 2025" },
        { voyage_id: "VYG-2025-081", cargo: "Coking Coal", route: "Gladstone → Paradip", vessel: "MV Pacific Prosper", quantity: 170000, cost_per_mt: 14.60, status: "ACTIVE", date_str: "12 Feb 2025" },
        { voyage_id: "VYG-2025-080", cargo: "Iron Ore", route: "Port Hedland → Dhamra", vessel: "MV Iron Leader", quantity: 185000, cost_per_mt: 10.15, status: "ACTIVE", date_str: "11 Feb 2025" },
        { voyage_id: "VYG-2025-079", cargo: "Coking Coal", route: "Hay Point → Paradip", vessel: "MV Golden Voyager", quantity: 165000, cost_per_mt: 14.55, status: "ACTIVE", date_str: "10 Feb 2025" },
        { voyage_id: "VYG-2025-078", cargo: "Thermal Coal", route: "Gladstone → Visakhapatnam", vessel: "MV Southern Cross", quantity: 75000, cost_per_mt: 14.15, status: "ACTIVE", date_str: "08 Feb 2025" },
        { voyage_id: "VYG-2025-077", cargo: "Coking Coal", route: "Hay Point → Paradip", vessel: "MV Capesize Apex", quantity: 165000, cost_per_mt: 14.35, status: "COMPLETED", date_str: "07 Feb 2025" },
        { voyage_id: "VYG-2025-076", cargo: "Thermal Coal", route: "Newcastle → Paradip", vessel: "MV East Bulk", quantity: 150000, cost_per_mt: 13.90, status: "COMPLETED", date_str: "04 Feb 2025" },
        { voyage_id: "VYG-2025-075", cargo: "Coking Coal", route: "Hay Point → Paradip", vessel: "MV Indian Bulk", quantity: 165000, cost_per_mt: 13.60, status: "COMPLETED", date_str: "30 Jan 2025" },
      ];

      return {
        upcoming_count: 4,
        active_count: 6,
        completed_count: 32,
        upcoming_scheduled_mt: 680000,
        upcoming_avg_cost: 14.92,
        upcoming_laycan_window: "18 FEB - 08 MAR",
        active_in_transit_mt: 1025000,
        active_avg_progress: 58,
        active_vessels_count: 6,
        completed_avg_cost: 14.42,
        completed_total_vol_mt: 5420000,
        completed_settlement_trend: [
          { month: "NOV", rate: 13.80 },
          { month: "DEC", rate: 13.60 },
          { month: "JAN", rate: 14.10 },
          { month: "FEB", rate: 14.42 }
        ],
        ledger: defaultLedger
      };
    }
  }
};
