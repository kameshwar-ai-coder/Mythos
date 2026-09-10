import api from './api';
import { CurrentMarketData, MarketHistoryItem } from '../types';

export const marketService = {
  getCurrent: async (origin?: string, destination?: string, cargo?: string): Promise<CurrentMarketData> => {
    try {
      const res = await api.get<CurrentMarketData>('/api/market/current', {
        params: { origin, destination, cargo }
      });
      return res.data;
    } catch {
      return {
        freight_rate: 14.85,
        market_direction: "BULLISH",
        momentum: "STRONG MOMENTUM • 88% CONF",
        confidence: 88,
        volatility_label: "MODERATE",
        volatility_pct: 4.2,
        volatility_index: 38,
        change_7d_avg: 0.35
      };
    }
  },

  getHistory: async (origin?: string, destination?: string, cargo?: string): Promise<MarketHistoryItem[]> => {
    try {
      const res = await api.get<MarketHistoryItem[]>('/api/market/history', {
        params: { origin, destination, cargo }
      });
      return res.data;
    } catch {
      return [
        { date: "14 FEB 2025", route: "Hay Point → Paradip", vessel_type: "Capesize", cargo: "Coking Coal", quantity: 165000, rate_per_mt: 14.85, change_dod: "+$0.15", status: "SPOT" },
        { date: "13 FEB 2025", route: "Hay Point → Paradip", vessel_type: "Capesize", cargo: "Coking Coal", quantity: 160000, rate_per_mt: 14.70, change_dod: "+$0.10", status: "FIXED" },
        { date: "12 FEB 2025", route: "Gladstone → Paradip", vessel_type: "Capesize", cargo: "Coking Coal", quantity: 170000, rate_per_mt: 14.60, change_dod: "+$0.05", status: "FIXED" },
        { date: "11 FEB 2025", route: "Port Hedland → Dhamra", vessel_type: "Newcastlemax", cargo: "Iron Ore", quantity: 185000, rate_per_mt: 10.15, change_dod: "0.00", status: "FIXED" },
        { date: "10 FEB 2025", route: "Hay Point → Paradip", vessel_type: "Capesize", cargo: "Coking Coal", quantity: 165000, rate_per_mt: 14.55, change_dod: "+$0.20", status: "FIXED" },
        { date: "07 FEB 2025", route: "Hay Point → Paradip", vessel_type: "Capesize", cargo: "Coking Coal", quantity: 165000, rate_per_mt: 14.35, change_dod: "-$0.05", status: "FIXED" },
        { date: "04 FEB 2025", route: "Newcastle → Paradip", vessel_type: "Capesize", cargo: "Thermal Coal", quantity: 150000, rate_per_mt: 13.90, change_dod: "+$0.15", status: "FIXED" },
        { date: "30 JAN 2025", route: "Hay Point → Paradip", vessel_type: "Capesize", cargo: "Coking Coal", quantity: 165000, rate_per_mt: 13.60, change_dod: "+$0.25", status: "BENCHMARK" },
      ];
    }
  },

  getForecast: async (origin?: string, destination?: string) => {
    try {
      const res = await api.get('/api/market/forecast', {
        params: { origin, destination }
      });
      return res.data;
    } catch {
      return {
        h7: { horizon_days: 7, date_str: "21 FEB 2025", forecast_rate: 15.40, change_usd: 0.55, change_pct: 3.7, confidence_pct: 94, range_min: 15.10, range_max: 15.65 },
        h14: { horizon_days: 14, date_str: "28 FEB 2025", forecast_rate: 15.85, change_usd: 1.00, change_pct: 6.7, confidence_pct: 88, range_min: 15.40, range_max: 16.20 },
        h30: { horizon_days: 30, date_str: "16 MAR 2025", forecast_rate: 16.50, change_usd: 1.65, change_pct: 11.1, confidence_pct: 79, range_min: 15.80, range_max: 17.15 },
      };
    }
  }
};
