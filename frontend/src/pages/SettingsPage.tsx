import React, { useState, useEffect } from 'react';
import { RotateCcw, Check, Shield } from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { UserSettingsData } from '../types';
import { useCurrency } from '../context/CurrencyContext';

export const SettingsPage: React.FC = () => {
  const { setCurrency } = useCurrency();
  const [settings, setSettings] = useState<UserSettingsData>({
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
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsService.getSettings();
      setSettings(res);
      if (res?.reporting_currency) {
        setCurrency(res.reporting_currency);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      await settingsService.updateSettings(settings);
      setCurrency(settings.reporting_currency);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    const defaultVal: UserSettingsData = {
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
    setSettings(defaultVal);
    setCurrency(defaultVal.reporting_currency);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] text-[#6C7A89] uppercase font-bold tracking-wider">
            System Configuration // Console Parameters
          </div>
          <h1 className="font-mono text-2xl font-bold text-[#22272E] tracking-tight uppercase mt-0.5">
            Settings
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="font-mono text-xs font-semibold bg-[#FAFBFD] hover:bg-slate-100 text-[#22272E] border border-[#DFE6EE] px-4 py-2 rounded flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            className="font-mono text-xs font-semibold bg-[#22272E] hover:bg-[#1B2028] text-white px-5 py-2 rounded flex items-center gap-2 transition-colors shadow-sm"
          >
            <Check size={14} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-[#22272E] text-white p-3 rounded font-mono text-xs flex items-center justify-between animate-fadeIn">
          <span>✓ Configurations saved successfully to terminal database.</span>
        </div>
      )}

      {/* 2 Column Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 01 // USER PROFILE */}
        <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4">
          <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
            01 // User Profile
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="text-[#6C7A89] font-bold block mb-1">USER FULL NAME</label>
              <input
                type="text"
                value={settings.full_name}
                onChange={(e) => setSettings({ ...settings, full_name: e.target.value })}
                className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:border-[#22272E]"
              />
            </div>

            <div>
              <label className="text-[#6C7A89] font-bold block mb-1">OPERATIONAL ROLE / TITLE</label>
              <input
                type="text"
                value={settings.role_title}
                onChange={(e) => setSettings({ ...settings, role_title: e.target.value })}
                className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:border-[#22272E]"
              />
            </div>

            <div>
              <label className="text-[#6C7A89] font-bold block mb-1">DISPATCH EMAIL ROUTE</label>
              <input
                type="email"
                value={settings.email_route}
                onChange={(e) => setSettings({ ...settings, email_route: e.target.value })}
                className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:border-[#22272E]"
              />
            </div>

            <div>
              <label className="text-[#6C7A89] font-bold block mb-1">REPORTING CURRENCY</label>
              <select
                value={settings.reporting_currency}
                onChange={(e) => setSettings({ ...settings, reporting_currency: e.target.value })}
                className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#22272E]"
              >
                <option value="USD ($) — Standard Maritime">USD ($) — Standard Maritime</option>
                <option value="INR (₹) — Domestic Terminal">INR (₹) — Domestic Terminal</option>
                <option value="EUR (€) — Continental">EUR (€) — Continental</option>
              </select>
            </div>
          </div>
        </div>

        {/* 02 // NOTIFICATIONS & DISPATCHES */}
        <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
              02 // Notifications & Dispatches
            </div>
            <div className="font-mono text-[10px] text-[#6C7A89] font-bold uppercase">
              PUSH & COMMS
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs divide-y divide-[#DFE6EE]">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between pt-2">
              <div className="pr-4">
                <div className="font-bold text-[#22272E]">Spot Rate Alerts</div>
                <div className="text-[10px] text-[#6C7A89]">Trigger instant telemetry flag when C5 index fluctuates &gt; 2% DoD</div>
              </div>
              <input
                type="checkbox"
                checked={settings.spot_rate_alerts}
                onChange={(e) => setSettings({ ...settings, spot_rate_alerts: e.target.checked })}
                className="w-4 h-4 accent-[#22272E] rounded cursor-pointer"
              />
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between pt-3">
              <div className="pr-4">
                <div className="font-bold text-[#22272E]">Port Congestion & Berthing Delays</div>
                <div className="text-[10px] text-[#6C7A89]">Wait times at target terminals exceeding +48h against stem timetable</div>
              </div>
              <input
                type="checkbox"
                checked={settings.port_congestion_alerts}
                onChange={(e) => setSettings({ ...settings, port_congestion_alerts: e.target.checked })}
                className="w-4 h-4 accent-[#22272E] rounded cursor-pointer"
              />
            </div>

            {/* Toggle 3 */}
            <div className="flex items-center justify-between pt-3">
              <div className="pr-4">
                <div className="font-bold text-[#22272E]">Vessel Availability Match Score</div>
                <div className="text-[10px] text-[#6C7A89]">Notify when candidate vessel hits &gt; 90% suitability score for laycan window</div>
              </div>
              <input
                type="checkbox"
                checked={settings.vessel_availability_alerts}
                onChange={(e) => setSettings({ ...settings, vessel_availability_alerts: e.target.checked })}
                className="w-4 h-4 accent-[#22272E] rounded cursor-pointer"
              />
            </div>

            {/* Toggle 4 */}
            <div className="flex items-center justify-between pt-3">
              <div className="pr-4">
                <div className="font-bold text-[#22272E]">Fixture Approvals & Confirmations</div>
                <div className="text-[10px] text-[#6C7A89]">Broker contract signing, tender locking, and charter party execution</div>
              </div>
              <input
                type="checkbox"
                checked={settings.fixture_approvals_alerts}
                onChange={(e) => setSettings({ ...settings, fixture_approvals_alerts: e.target.checked })}
                className="w-4 h-4 accent-[#22272E] rounded cursor-pointer"
              />
            </div>

            {/* Toggle 5 */}
            <div className="flex items-center justify-between pt-3">
              <div className="pr-4">
                <div className="font-bold text-[#22272E]">Daily Intelligence Digest</div>
                <div className="text-[10px] text-[#6C7A89]">Consolidated market summary sent at 08:00 UTC</div>
              </div>
              <input
                type="checkbox"
                checked={settings.daily_digest_alerts}
                onChange={(e) => setSettings({ ...settings, daily_digest_alerts: e.target.checked })}
                className="w-4 h-4 accent-[#22272E] rounded cursor-pointer"
              />
            </div>

            {/* Toggle 6 */}
            <div className="flex items-center justify-between pt-3">
              <div className="pr-4">
                <div className="font-bold text-[#22272E]">SMS / Direct Urgent Dispatch</div>
                <div className="text-[10px] text-[#6C7A89]">Direct emergency telecommunication route for critical demurrage spikes</div>
              </div>
              <input
                type="checkbox"
                checked={settings.sms_urgent_dispatch}
                onChange={(e) => setSettings({ ...settings, sms_urgent_dispatch: e.target.checked })}
                className="w-4 h-4 accent-[#22272E] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 03 // SYSTEM SETTINGS */}
        <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
              03 // System Settings
            </div>
            <div className="font-mono text-[10px] text-[#6C7A89] font-bold uppercase">
              CLIENT ENVIRONMENT
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div>
              <label className="text-[#6C7A89] font-bold block mb-1">DEFAULT STARTING SCREEN</label>
              <select
                value={settings.default_starting_screen}
                onChange={(e) => setSettings({ ...settings, default_starting_screen: e.target.value })}
                className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#22272E]"
              >
                <option value="Dashboard">Dashboard</option>
                <option value="Cargo">Cargo Requirement</option>
                <option value="Market">Market Intelligence</option>
                <option value="History">Voyage History</option>
              </select>
            </div>

            <div>
              <label className="text-[#6C7A89] font-bold block mb-1">DISPLAY DENSITY</label>
              <select
                value={settings.display_density}
                onChange={(e) => setSettings({ ...settings, display_density: e.target.value })}
                className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#22272E]"
              >
                <option value="High Density (Terminal)">High Density (Terminal)</option>
                <option value="Standard Desktop">Standard Desktop</option>
                <option value="Compact Mobile">Compact Mobile</option>
              </select>
            </div>

            <div>
              <label className="text-[#6C7A89] font-bold block mb-1">TABLE PAGINATION COUNT</label>
              <select
                value={settings.table_pagination_count}
                onChange={(e) => setSettings({ ...settings, table_pagination_count: Number(e.target.value) })}
                className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#22272E]"
              >
                <option value={10}>10 Records / Page</option>
                <option value={20}>20 Records / Page</option>
                <option value={50}>50 Records / Page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Encrypted Policy Footer */}
      <div className="bg-[#FAFBFD] border border-[#DFE6EE] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 font-mono text-xs text-[#6C7A89]">
          <Shield size={16} className="text-[#22272E]" />
          <span>Enterprise Policy Encrypted • Last updated: 04 March 2025 by Capt. J. Vance</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="font-mono text-xs font-bold bg-white hover:bg-slate-50 text-[#22272E] border border-[#DFE6EE] px-4 py-2 rounded transition-colors"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSave}
            className="font-mono text-xs font-bold bg-[#22272E] hover:bg-[#1B2028] text-white px-5 py-2 rounded flex items-center gap-2 transition-colors shadow-sm"
          >
            <Check size={14} />
            <span>Save Configurations</span>
          </button>
        </div>
      </div>
    </div>
  );
};
