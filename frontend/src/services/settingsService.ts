import api from './api';
import { UserSettingsData } from '../types';

export const settingsService = {
  getSettings: async (): Promise<UserSettingsData> => {
    try {
      const res = await api.get<UserSettingsData>('/api/settings');
      return res.data;
    } catch {
      return {
        full_name: "Capt. J. Vance",
        role_title: "Chief Charterer & Head of Procurement",
        email_route: "j.vance@sailfreight.intl",
        reporting_currency: "USD ($) — Standard Maritime",
        spot_rate_alerts: true,
        port_congestion_alerts: true,
        vessel_availability_alerts: true,
        fixture_approvals_alerts: true,
        daily_digest_alerts: false,
        sms_urgent_dispatch: false,
        default_starting_screen: "Dashboard",
        display_density: "High Density (Terminal)",
        table_pagination_count: 10
      };
    }
  },

  updateSettings: async (payload: UserSettingsData): Promise<UserSettingsData> => {
    try {
      const res = await api.put<UserSettingsData>('/api/settings', payload);
      return res.data;
    } catch {
      return payload;
    }
  }
};
