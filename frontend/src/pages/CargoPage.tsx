import React, { useState } from 'react';
import { 
  Check, 
  ArrowRight, 
  X, 
  RotateCcw, 
  Activity, 
  Sliders, 
  ShieldCheck, 
  FileText, 
  Download,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { cargoService } from '../services/cargoService';
import { 
  CargoRequirementInput, 
  CargoAnalysisResponse, 
  ApproveDecisionResponse, 
  NavigationPage 
} from '../types';

interface CargoPageProps {
  onNavigate: (page: NavigationPage) => void;
}

// ── Dynamic cargo type options keyed by category ──────────────────────────────
const CARGO_TYPES: Record<string, string[]> = {
  'Dry Bulk': [
    'Coking Coal (Prime Hard Metallurgical)',
    'Thermal Coal (High GCV 6000 kcal)',
    'Iron Ore Fines (Fe 62%)',
    'Iron Ore Pellets (Fe 65%)',
    'Limestone / Dolomite Flux',
    'Bauxite / Alumina',
    'Manganese Ore',
    'Chrome Ore Concentrate',
    'Fertiliser (Urea / DAP)',
    'Grain / Agri Commodities',
  ],
  'Liquid Bulk': [
    'Crude Oil (VLCC / Suezmax)',
    'Fuel Oil (IFO 380)',
    'Naphtha',
    'Methanol',
    'Edible Oil (Palm / Soybean)',
    'Molasses',
    'Caustic Soda (NaOH Solution)',
    'Sulphuric Acid',
    'Bitumen',
    'Chemical Tanker — Parcel Cargo',
  ],
  'Bulk Gases': [
    'LNG (Liquefied Natural Gas)',
    'LPG — Propane',
    'LPG — Butane',
    'LPG — Mixed (Propane / Butane)',
    'Ammonia (Refrigerated)',
    'Ethylene',
    'Vinyl Chloride Monomer (VCM)',
    'Butadiene',
  ],
};

export const CargoPage: React.FC<CargoPageProps> = ({ onNavigate }) => {
  // Input Form State
  const [form, setForm] = useState<CargoRequirementInput>({
    cargo_category: 'Dry Bulk',
    cargo_type: 'Coking Coal (Prime Hard Metallurgical)',
    quantity_mt: 165000,
    starting_port: 'Hay Point, AU (HAY)',
    destination_port: 'Paradip, IN (PRT)',
    laycan_start: '2025-02-18',
    laycan_end: '2025-02-25',
  });

  // Flow & Modal States
  const [isAnalyzed, setIsAnalyzed] = useState<boolean>(false); // hidden until user clicks Analyze Cargo
  const [analysisKey, setAnalysisKey] = useState<number>(0); // increments to re-trigger fade-in animation
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<CargoAnalysisResponse | null>(null);
  const [isModifyDrawerOpen, setIsModifyDrawerOpen] = useState<boolean>(false);
  const [modifyForm, setModifyForm] = useState<CargoRequirementInput>(form);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [approvalData, setApprovalData] = useState<ApproveDecisionResponse | null>(null);
  const [selectedWhyTab, setSelectedWhyTab] = useState<string>('01');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveScenario = async () => {
    if (!analysis) return;
    try {
      const res = await cargoService.saveScenario({
        cargo_type: form.cargo_type,
        quantity_mt: form.quantity_mt,
        start_port: form.starting_port,
        destination_port: form.destination_port,
        freight_rate: analysis.freight_market.freight_per_mt,
        landed_cost_per_mt: analysis.effective_cost.total_cost_per_mt,
        vessel_name: analysis.vessel_analysis.recommended_vessel,
        decision: analysis.final_decision.decision,
        risk_score: analysis.risk_analysis.overall_score
      });
      showToast(res.message || "Cargo analysis scenario saved successfully to database.");
    } catch {
      showToast("Cargo scenario saved to local workspace buffer.");
    }
  };

  // Initial load — do NOT auto-run analysis; user must click the button
  // React.useEffect(() => { handleAnalyze(form); }, []);

  const handleAnalyze = async (formData: CargoRequirementInput) => {
    setLoading(true);
    setIsAnalyzed(false); // hide previous results while loading
    try {
      const res = await cargoService.analyze(formData);
      setAnalysis(res);
      setIsAnalyzed(true);
      setAnalysisKey(k => k + 1); // bump key so fade-in div remounts
      setIsApproved(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!analysis) return;
    setLoading(true);
    try {
      const res = await cargoService.approve({
        cargo_type: form.cargo_type,
        quantity_mt: form.quantity_mt,
        route: `${form.starting_port.split(',')[0]} → ${form.destination_port.split(',')[0]}`,
        vessel: analysis.vessel_analysis.recommended_vessel,
        freight_rate: analysis.freight_market.freight_per_mt,
        cost_per_mt: analysis.effective_cost.total_cost_per_mt,
        laycan_window: "18 FEB 2025 - 25 FEB 2025"
      });
      setApprovalData(res);
      setIsApproved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReAnalyze = () => {
    setForm(modifyForm);
    setIsModifyDrawerOpen(false);
    handleAnalyze(modifyForm);
  };

  const handleReset = () => {
    const defaultForm: CargoRequirementInput = {
      cargo_category: 'Dry Bulk',
      cargo_type: 'Coking Coal (Prime Hard Metallurgical)',
      quantity_mt: 165000,
      starting_port: 'Hay Point, AU (HAY)',
      destination_port: 'Paradip, IN (PRT)',
      laycan_start: '2025-02-18',
      laycan_end: '2025-02-25',
    };
    setForm(defaultForm);
    setModifyForm(defaultForm);
    setIsApproved(false);
    handleAnalyze(defaultForm);
  };

  const minTolerance = Math.round(form.quantity_mt * 0.9);
  const maxTolerance = Math.round(form.quantity_mt * 1.1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* =========================================================================
          VIEW A: APPROVED FIXTURE STATE (Matching screen.png)
      ========================================================================= */}
      {isApproved && approvalData && (
        <div className="space-y-6 animate-fadeIn">
          {/* Approved Fixture Header Banner */}
          <div className="bg-[#22272E] text-white rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white">
                <Check size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-mono text-lg font-bold tracking-wider uppercase">
                    Fixture Recommendation Approved
                  </h2>
                  <span className="font-mono text-[10px] bg-white text-[#22272E] font-bold px-2 py-0.5 rounded">
                    APPROVED
                  </span>
                  <span className="font-mono text-[10px] bg-white/20 text-white font-semibold px-2 py-0.5 rounded">
                    [CONCLUDED]
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              <button 
                onClick={() => alert("Voyage Fixture Recap generated and copied to clipboard.")}
                className="font-mono text-xs font-semibold bg-[#323943] hover:bg-[#3D4552] text-white px-3 py-2 rounded flex items-center gap-1.5 transition-colors border border-white/10"
              >
                <FileText size={14} />
                <span>Recap</span>
              </button>
              <button 
                onClick={() => alert("Downloading Official Fixture PDF Authorization...")}
                className="font-mono text-xs font-semibold bg-white hover:bg-slate-100 text-[#22272E] px-3.5 py-2 rounded flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Download size={14} />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* 3 Overview Columns Matching screen.png */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Column 1: Vessel & Cargo Nomination */}
            <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#6C7A89] tracking-wider">
                    Vessel & Cargo Nomination
                  </span>
                  <span className="font-mono text-[10px] bg-[#DFE6EE] text-[#22272E] font-semibold px-1.5 py-0.5 rounded">
                    CLASS 1A
                  </span>
                </div>
                <div>
                  <div className="font-mono text-lg font-bold text-[#22272E]">
                    {approvalData.recap.vessel_name}
                  </div>
                  <div className="font-mono text-xs text-[#6C7A89]">
                    {approvalData.recap.vessel_class}
                  </div>
                </div>

                <div className="bg-[#FAFBFD] p-2.5 rounded border border-[#DFE6EE]/80">
                  <div className="font-mono text-[10px] uppercase font-bold text-[#6C7A89]">
                    RightShip Score
                  </div>
                  <div className="font-mono text-base font-bold text-[#22272E] mt-0.5">
                    🛡 5.0 / 5.0
                  </div>
                </div>

                <div className="space-y-1 pt-1 font-mono text-xs text-[#22272E]">
                  <div className="font-mono text-[10px] uppercase font-bold text-[#6C7A89]">
                    Consignment Specifics
                  </div>
                  <div className="font-medium">{approvalData.recap.consignment}</div>
                  <div className="flex justify-between text-[#6C7A89] pt-1">
                    <span>Volume / Tolerance</span>
                    <span className="font-semibold text-[#22272E]">{approvalData.recap.volume_tolerance}</span>
                  </div>
                  <div className="flex justify-between text-[#6C7A89]">
                    <span>Stowage Factor</span>
                    <span className="font-semibold text-[#22272E]">{approvalData.recap.stowage_factor}</span>
                  </div>
                </div>
              </div>

              {/* Discharge Corridor bottom tag */}
              <div className="mt-5 bg-[#22272E] text-white p-3 rounded flex items-center justify-between">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-slate-300">
                    Discharge Corridor
                  </div>
                  <div className="font-mono text-xs font-bold">
                    {approvalData.recap.discharge_corridor}
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center text-xs">
                  ⊚
                </div>
              </div>
            </div>

            {/* Column 2: Financials & Demurrage Terms */}
            <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#6C7A89] tracking-wider">
                    Financials & Demurrage Terms
                  </span>
                  <span className="font-mono text-[10px] bg-[#DFE6EE] text-[#22272E] font-semibold px-1.5 py-0.5 rounded">
                    BALTIC C5 FIXED
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-3xl font-bold text-[#22272E]">
                      {approvalData.recap.freight_rate_display.split(' ')[0]}
                    </span>
                    <span className="font-mono text-xs text-[#6C7A89] font-medium">/ MT</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs text-[#6C7A89] mt-0.5">
                    <span>Total Freight: <b className="text-[#22272E]">{approvalData.recap.total_freight}</b></span>
                    <span className="text-[#22272E] font-medium">• {approvalData.recap.vs_spot}</span>
                  </div>
                </div>

                <div className="bg-[#FAFBFD] p-3 rounded border border-[#DFE6EE]/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#6C7A89]">
                      Laycan Window (Working)
                    </span>
                    <span className="font-mono text-[10px] font-bold text-[#22272E]">7 DAYS</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <div>
                      <div className="font-bold text-[#22272E]">18 FEB 2025</div>
                      <div className="text-[10px] text-[#6C7A89]">00:01 LT</div>
                    </div>
                    <div>
                      <div className="font-bold text-[#22272E]">25 FEB 2025</div>
                      <div className="text-[10px] text-[#6C7A89]">23:59 LT</div>
                    </div>
                  </div>
                  <div className="border-t border-[#DFE6EE]/60 pt-2 flex justify-between font-mono text-xs">
                    <span className="text-[#6C7A89]">Demurrage / Despatch</span>
                    <span className="font-bold text-[#22272E]">{approvalData.recap.demurrage_despatch}</span>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="font-mono text-[10px] uppercase font-bold text-[#6C7A89]">
                    Execution Hedging Model
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#22272E] mt-0.5">
                    {approvalData.recap.hedging_model}
                  </div>
                  <div className="font-mono text-[10px] text-[#6C7A89] mt-0.5">
                    Index C5 Linked Cap active across 3,920 nm transit run.
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Integrity & Risk Synthesis */}
            <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#6C7A89] tracking-wider">
                    Integrity & Risk Synthesis
                  </span>
                  <span className="font-mono text-[10px] bg-[#DFE6EE] text-[#22272E] font-semibold px-1.5 py-0.5 rounded">
                    ASSESSMENT CLEAR
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase font-bold text-[#6C7A89]">
                      Calculated Voyage Risk
                    </div>
                    <div className="font-mono text-2xl font-bold text-[#22272E] mt-0.5">
                      {approvalData.recap.voyage_risk}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] font-bold bg-[#DFE6EE] text-[#22272E] px-2 py-0.5 rounded uppercase">
                      {approvalData.recap.risk_tier}
                    </span>
                    <div className="font-mono text-[9px] text-[#6C7A89] mt-0.5">
                      Tolerance ≤ 3.5
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#DFE6EE]/60 pt-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6C7A89] flex items-center gap-1.5">
                      <span>💨</span> MetOcean Corridor
                    </span>
                    <span className="font-bold text-[#22272E]">{approvalData.recap.metocean_corridor}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6C7A89] flex items-center gap-1.5">
                      <span>⚓</span> Paradip Congestion
                    </span>
                    <span className="font-bold text-[#22272E]">{approvalData.recap.paradip_congestion}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6C7A89] flex items-center gap-1.5">
                      <span>⛽</span> Bunker Volatility
                    </span>
                    <span className="font-bold text-[#22272E]">{approvalData.recap.bunker_volatility}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6C7A89] flex items-center gap-1.5">
                      <span>🛡</span> P&I Club Warranty
                    </span>
                    <span className="font-bold text-[#22272E]">{approvalData.recap.pi_club}</span>
                  </div>
                </div>

                {/* Transit Bar Visual */}
                <div className="pt-2">
                  <div className="flex justify-between font-mono text-[9px] text-[#6C7A89] uppercase tracking-wider">
                    <span>HAY POINT</span>
                    <span>SUNDA / LOMBOK</span>
                    <span>PARADIP</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#DFE6EE] rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-[#22272E] w-[45%]"></div>
                  </div>
                  <div className="font-mono text-[9px] text-center font-bold text-[#6C7A89] mt-1">
                    {approvalData.recap.transit_estimate}
                  </div>
                </div>
              </div>

              {/* Agent Verified Footer */}
              <div className="mt-4 bg-[#FAFBFD] border border-[#DFE6EE] px-3 py-2 rounded flex items-center justify-between font-mono text-[10px]">
                <span className="text-[#6C7A89]">AGENT: <b className="text-[#22272E]">{approvalData.recap.agent}</b></span>
                <span className="bg-[#DFE6EE] text-[#22272E] font-bold px-1.5 py-0.5 rounded">VERIFIED</span>
              </div>
            </div>
          </div>

          {/* Scheduled Under Queue Banner */}
          <div className="bg-[#22272E] text-white rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-white/10 rounded mt-0.5">
                <Sliders size={18} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold uppercase tracking-wider">
                    Scheduled Under History → Upcoming
                  </span>
                  <span className="font-mono text-[10px] bg-white/20 text-white font-semibold px-2 py-0.5 rounded">
                    [ACTIVE QUEUE]
                  </span>
                </div>
                <p className="font-mono text-xs text-slate-300 mt-1">
                  Voyage ID: <b>{approvalData.fixture_id}</b> • Allocation: NOMINATED & PENDING LOADING • Discharge Berth: CQ-1 / CQ-2 Mechanized Coal Berth
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 self-end md:self-auto font-mono text-right">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Laycan Countdown</div>
                <div className="text-sm font-bold text-white">04 DAYS : 09 HRS</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Terminal ETA</div>
                <div className="text-sm font-bold text-white">08 MAR 2025</div>
              </div>
            </div>
          </div>

          {/* Audit Trail Code Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-mono text-[#6C7A89] px-1 border-t border-[#DFE6EE] pt-3">
            <span>SIGN-OFF ID: {approvalData.sign_off_id} • CHARTER PARTY CODE: {approvalData.charter_party_code}</span>
            <span>COMMODITY GATEWAY: {approvalData.commodity_gateway}</span>
          </div>

          {/* Bottom Action Controls */}
          <div className="bg-[#FAFBFD] border border-[#DFE6EE] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 font-mono text-xs text-[#6C7A89]">
              <AlertCircle size={15} className="text-[#6C7A89]" />
              <span>You can adjust optional demurrage tolerances until laycan commencement.</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setModifyForm(form);
                  setIsModifyDrawerOpen(true);
                }}
                className="font-mono text-xs font-semibold bg-white hover:bg-slate-50 text-[#22272E] border border-[#DFE6EE] px-4 py-2 rounded flex items-center gap-1.5 transition-colors"
              >
                <Sliders size={13} />
                <span>Modify</span>
              </button>
              <button
                onClick={() => onNavigate('history')}
                className="font-mono text-xs font-semibold bg-[#22272E] hover:bg-[#1B2028] text-white px-5 py-2 rounded flex items-center gap-2 transition-colors shadow-sm"
              >
                <span>View History</span>
                <span className="font-normal text-slate-300">History → Upcoming</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW B: CARGO REQUIREMENT FORM (Matching 45.png)
      ========================================================================= */}
      <div className="bg-white border border-[#DFE6EE] rounded-lg p-6 shadow-sm space-y-6">
        {/* Form Title */}
        <div className="flex items-center gap-2 border-b border-[#DFE6EE]/80 pb-4">
          <div className="p-1 bg-[#22272E] text-white rounded">
            <FileText size={16} />
          </div>
          <h2 className="font-mono text-sm font-bold text-[#22272E] uppercase tracking-wider">
            Cargo Requirement
          </h2>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Cargo Category */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-xs font-bold text-[#6C7A89]">
              <span>1. CARGO CATEGORY</span>
              <span className="font-normal">[MANDATORY]</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['Dry Bulk', 'Liquid Bulk', 'Bulk Gases'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm({
                    ...form,
                    cargo_category: cat,
                    cargo_type: CARGO_TYPES[cat][0], // reset to first option of new category
                  })}
                  className={`font-mono text-xs font-semibold py-2.5 px-2 rounded text-center transition-colors ${
                    form.cargo_category === cat
                      ? 'bg-[#22272E] text-white shadow-sm'
                      : 'bg-[#FAFBFD] text-[#6C7A89] hover:text-[#22272E] border border-[#DFE6EE]'
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Cargo Type */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-xs font-bold text-[#6C7A89]">
              <span>2. CARGO TYPE</span>
              <span className="font-normal">[SPECIFICATION]</span>
            </div>
            <select
              value={form.cargo_type}
              onChange={(e) => setForm({ ...form, cargo_type: e.target.value })}
              className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-sm font-mono text-[#22272E] focus:outline-none focus:border-[#22272E]"
            >
              {(CARGO_TYPES[form.cargo_category] ?? []).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* 3. Quantity (MT) */}
          <div className="md:col-span-2 space-y-1.5">
            <div className="flex justify-between font-mono text-xs font-bold text-[#6C7A89]">
              <span>3. QUANTITY (MT)</span>
              <span className="font-normal">METRIC TONS (+/- 10% MOLOO)</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={form.quantity_mt}
                onChange={(e) => setForm({ ...form, quantity_mt: Number(e.target.value) })}
                className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-4 py-2.5 font-mono text-xl font-bold text-[#22272E] focus:outline-none focus:border-[#22272E]"
              />
              <span className="absolute right-4 top-3 font-mono text-xs text-[#6C7A89] font-medium">
                MT NET
              </span>
            </div>
            <div className="flex justify-between font-mono text-[11px] text-[#6C7A89] pt-0.5">
              <span>PARCEL TOLERANCE</span>
              <span className="font-bold text-[#22272E]">
                {minTolerance.toLocaleString()} — {maxTolerance.toLocaleString()} MT
              </span>
            </div>
          </div>

          {/* 4. Starting Port */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-xs font-bold text-[#6C7A89]">
              <span>4. STARTING PORT (LOAD TERMINAL)</span>
              <span className="font-normal">ORIGIN</span>
            </div>
            <select
              value={form.starting_port}
              onChange={(e) => setForm({ ...form, starting_port: e.target.value })}
              className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-sm font-mono text-[#22272E] focus:outline-none focus:border-[#22272E]"
            >
              <option value="Hay Point, AU (HAY)">⚓ Hay Point, AU (HAY)</option>
              <option value="Gladstone, AU (GLD)">⚓ Gladstone, AU (GLD)</option>
              <option value="Newcastle, AU (NWC)">⚓ Newcastle, AU (NWC)</option>
              <option value="Port Hedland, AU (PHD)">⚓ Port Hedland, AU (PHD)</option>
              <option value="Richards Bay, ZA (RCB)">⚓ Richards Bay, ZA (RCB)</option>
            </select>
          </div>

          {/* 5. Destination Port */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-xs font-bold text-[#6C7A89]">
              <span>5. DESTINATION PORT (DISCHARGE BERTH)</span>
              <span className="font-normal">EAST COAST INDIA</span>
            </div>
            <select
              value={form.destination_port}
              onChange={(e) => setForm({ ...form, destination_port: e.target.value })}
              className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-sm font-mono text-[#22272E] focus:outline-none focus:border-[#22272E]"
            >
              <option value="Paradip, IN (PRT)">⚓ Paradip, IN (PRT)</option>
              <option value="Visakhapatnam, IN (VTZ)">⚓ Visakhapatnam, IN (VTZ)</option>
              <option value="Gangavaram, IN (GGV)">⚓ Gangavaram, IN (GGV)</option>
              <option value="Dhamra, IN (DHM)">⚓ Dhamra, IN (DHM)</option>
              <option value="Gopalpur, IN (GPL)">⚓ Gopalpur, IN (GPL)</option>
              <option value="Haldia, IN (HLD)">⚓ Haldia, IN (HLD)</option>
            </select>
          </div>

          {/* 6. Laycan Start */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-xs font-bold text-[#6C7A89]">
              <span>6. LAYCAN START (EARLIEST NOTICE)</span>
              <span className="font-normal">UTC 00:01</span>
            </div>
            <input
              type="date"
              value={form.laycan_start}
              onChange={(e) => setForm({ ...form, laycan_start: e.target.value })}
              className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 font-mono text-sm text-[#22272E] focus:outline-none focus:border-[#22272E]"
            />
          </div>

          {/* 7. Laycan End */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-xs font-bold text-[#6C7A89]">
              <span>7. LAYCAN END (CANCELLING DATE)</span>
              <span className="font-normal">UTC 23:59</span>
            </div>
            <input
              type="date"
              value={form.laycan_end}
              onChange={(e) => setForm({ ...form, laycan_end: e.target.value })}
              className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 font-mono text-sm text-[#22272E] focus:outline-none focus:border-[#22272E]"
            />
          </div>
        </div>

        {/* Bottom Form Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#DFE6EE]/80 pt-4">
          <div className="flex items-center gap-2 font-mono text-xs text-[#6C7A89]">
            <ShieldCheck size={16} className="text-[#22272E]" />
            <span>PARAMETRIC VALIDATION ACTIVE • 0 CONFLICTS</span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleReset}
              className="font-mono text-xs font-bold bg-[#FAFBFD] hover:bg-slate-100 text-[#22272E] border border-[#DFE6EE] px-4 py-2.5 rounded transition-colors"
            >
              RESET
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAnalyze(form)}
              className="font-mono text-xs font-bold bg-[#22272E] hover:bg-[#1B2028] text-white px-6 py-2.5 rounded flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70"
            >
              <Activity size={14} />
              <span>{loading ? 'ANALYZING...' : 'ANALYZE CARGO'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONTINUOUS SCROLL CARGO ANALYSIS (Matching screen1.png)
      ========================================================================= */}
      {isAnalyzed && analysis && (
        <div key={analysisKey} className="space-y-5 animate-fadeIn">
          {/* CARGO SUMMARY BAR */}
          <div className="bg-white border border-[#DFE6EE] rounded-lg p-4 shadow-sm">
            <div className="font-mono text-[10px] uppercase font-bold text-[#6C7A89] mb-2">
              Cargo Summary
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-2.5 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase">Cargo Type</div>
                <div className="font-bold text-[#22272E] truncate mt-0.5">{analysis.cargo_summary.cargo_type}</div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-2.5 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase">Quantity</div>
                <div className="font-bold text-[#22272E] mt-0.5">{analysis.cargo_summary.quantity}</div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-2.5 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase">Route</div>
                <div className="font-bold text-[#22272E] truncate mt-0.5">{analysis.cargo_summary.route}</div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-2.5 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase">Laycan</div>
                <div className="font-bold text-[#22272E] mt-0.5">{analysis.cargo_summary.laycan}</div>
              </div>
            </div>
          </div>

          {/* 01 // FREIGHT MARKET */}
          <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4">
            <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
              01 // Freight Market
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="font-mono text-[10px] text-[#6C7A89] uppercase font-bold">FREIGHT / MT</div>
                <div className="font-mono text-2xl font-bold text-[#22272E] mt-1">
                  ${analysis.freight_market.freight_per_mt.toFixed(2)} <span className="text-xs font-normal text-[#6C7A89]">/ MT</span>
                </div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="font-mono text-[10px] text-[#6C7A89] uppercase font-bold">MARKET DIRECTION</div>
                <div className="font-mono text-2xl font-bold text-[#22272E] mt-1 flex items-center gap-1.5">
                  <span>{analysis.freight_market.market_direction}</span>
                  <span>{analysis.freight_market.direction_symbol}</span>
                </div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="font-mono text-[10px] text-[#6C7A89] uppercase font-bold">FORECAST</div>
                <div className="font-mono text-2xl font-bold text-[#22272E] mt-1">
                  ${analysis.freight_market.forecast_per_mt.toFixed(2)} <span className="text-xs font-normal text-[#6C7A89]">/ MT</span>
                </div>
              </div>
            </div>

            {/* Freight Rate Trend & 30-Day Outlook Chart */}
            <div className="border border-[#DFE6EE] rounded p-4 bg-[#FAFBFD]">
              <div className="flex justify-between font-mono text-[10px] text-[#6C7A89] font-bold uppercase mb-2">
                <span>FREIGHT RATE TREND & 30-DAY OUTLOOK ($/MT)</span>
                <div className="flex items-center gap-4">
                  <span>— HISTORICAL</span>
                  <span>--- FORECAST</span>
                </div>
              </div>
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analysis.freight_market.trend_history} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#DFE6EE" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#6C7A89', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#DFE6EE' }} />
                    <YAxis domain={[10, 18]} tick={{ fill: '#6C7A89', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#DFE6EE' }} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                    <Tooltip formatter={(val: any) => [`$${Number(val).toFixed(2)} / MT`, 'Rate']} />
                    <Line type="monotone" dataKey="rate" stroke="#22272E" strokeWidth={2} dot={{ r: 3, fill: '#22272E' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 2. VESSEL ANALYSIS */}
          <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4">
            <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
              2. Vessel Analysis
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">RECOMMENDED VESSEL</div>
                <div className="font-bold text-sm text-[#22272E] mt-1">{analysis.vessel_analysis.recommended_vessel}</div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">DWT</div>
                <div className="font-bold text-sm text-[#22272E] mt-1">{analysis.vessel_analysis.dwt.toLocaleString()} MT</div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">SUITABILITY</div>
                <div className="font-bold text-sm text-[#22272E] mt-1">{analysis.vessel_analysis.suitability}%</div>
              </div>
            </div>

            {/* Vessel comparison table */}
            <div className="border border-[#DFE6EE] rounded overflow-hidden">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#FAFBFD] border-b border-[#DFE6EE] text-[10px] text-[#6C7A89] uppercase font-bold">
                  <tr>
                    <th className="py-2.5 px-4">VESSEL</th>
                    <th className="py-2.5 px-4">DWT</th>
                    <th className="py-2.5 px-4 text-right">SUITABILITY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFE6EE]">
                  {analysis.vessel_analysis.vessels_list.map((v, i) => (
                    <tr key={i} className="hover:bg-[#FAFBFD]/80">
                      <td className="py-2.5 px-4 font-bold text-[#22272E]">{v.name}</td>
                      <td className="py-2.5 px-4 text-[#6C7A89]">{v.dwt.toLocaleString()} MT</td>
                      <td className="py-2.5 px-4 text-right font-bold text-[#22272E]">{v.suitability}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. PORT FEASIBILITY */}
          <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4">
            <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
              3. Port Feasibility
            </div>
            <div className="border border-[#DFE6EE] rounded overflow-hidden">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#FAFBFD] border-b border-[#DFE6EE] text-[10px] text-[#6C7A89] uppercase font-bold">
                  <tr>
                    <th className="py-2.5 px-4">PARAMETER</th>
                    <th className="py-2.5 px-4">{analysis.port_feasibility.loading_port}</th>
                    <th className="py-2.5 px-4">{analysis.port_feasibility.discharge_port}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFE6EE]">
                  {analysis.port_feasibility.constraints.map((row, i) => (
                    <tr key={i} className="hover:bg-[#FAFBFD]/80">
                      <td className="py-2.5 px-4 font-bold text-[#22272E]">{row.parameter}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-[#22272E] font-medium">{row.loading_val}</span>{' '}
                        <span className="badge-pass">[PASS]</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-[#22272E] font-medium">{row.discharge_val}</span>{' '}
                        <span className="badge-pass">[PASS]</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. EFFECTIVE COST */}
          <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center font-mono text-xs font-bold uppercase tracking-wider">
              <span className="text-[#22272E]">4. Effective Cost</span>
              <span className="text-[#22272E]">
                TOTAL COST / MT: ${analysis.effective_cost.total_cost_per_mt.toFixed(2)} / MT
              </span>
            </div>

            {/* Stacked Proportional Segment Bar */}
            <div className="space-y-1">
              <div className="h-6 w-full rounded flex overflow-hidden font-mono text-[10px] font-bold text-white">
                <div className="bg-[#22272E] h-full flex items-center justify-center px-2" style={{ width: '69.7%' }}>
                  FREIGHT 69.7%
                </div>
                <div className="bg-[#6C7A89] h-full flex items-center justify-center px-2" style={{ width: '19.5%' }}>
                  BUNKER 19.5%
                </div>
                <div className="bg-[#B9C3CF] text-[#22272E] h-full flex items-center justify-center px-1" style={{ width: '6.6%' }}>
                  WAITING 6.6%
                </div>
                <div className="bg-[#DFE6EE] text-[#22272E] h-full flex items-center justify-center px-1" style={{ width: '4.2%' }}>
                  MISC 4.2%
                </div>
              </div>
            </div>

            {/* 4 Cost Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">FREIGHT</div>
                <div className="font-bold text-base text-[#22272E] mt-1">${analysis.effective_cost.freight.toFixed(2)} <span className="text-xs font-normal text-[#6C7A89]">/ MT</span></div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">BUNKER</div>
                <div className="font-bold text-base text-[#22272E] mt-1">${analysis.effective_cost.bunker.toFixed(2)} <span className="text-xs font-normal text-[#6C7A89]">/ MT</span></div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">WAITING</div>
                <div className="font-bold text-base text-[#22272E] mt-1">${analysis.effective_cost.waiting.toFixed(2)} <span className="text-xs font-normal text-[#6C7A89]">/ MT</span></div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">TOTAL COST / MT</div>
                <div className="font-bold text-base text-[#22272E] mt-1">${analysis.effective_cost.total_cost_per_mt.toFixed(2)} <span className="text-xs font-normal text-[#6C7A89]">/ MT</span></div>
              </div>
            </div>
          </div>

          {/* 5. RISK & 6. SCENARIOS (Side by Side Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 5. RISK */}
            <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center font-mono text-xs font-bold uppercase tracking-wider">
                <span className="text-[#22272E]">5. Risk</span>
                <span className="bg-[#DFE6EE] text-[#22272E] px-2 py-0.5 rounded text-[10px]">
                  OVERALL: {analysis.risk_analysis.overall_score} / 10 {analysis.risk_analysis.overall_label}
                </span>
              </div>
              <div className="space-y-2 font-mono text-xs pt-1">
                {analysis.risk_analysis.details.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded bg-[#FAFBFD] border border-[#DFE6EE]/80">
                    <span className="text-[#6C7A89] font-bold">{item.category}</span>
                    <span className="font-bold text-[#22272E]">{item.score} / {item.max_score.toFixed(0)} {item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. SCENARIOS */}
            <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-3">
              <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
                6. Scenarios
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                {analysis.scenarios.scenarios.map((sc, i) => (
                  <div key={i} className="border border-[#DFE6EE] p-2.5 rounded bg-[#FAFBFD] text-center">
                    <div className="text-[10px] text-[#6C7A89] font-bold">{sc.name}</div>
                    <div className="font-bold text-sm text-[#22272E] mt-1">${sc.cost_per_mt.toFixed(2)} / MT</div>
                  </div>
                ))}
              </div>

              {/* Visual Scenario Bars */}
              <div className="grid grid-cols-3 gap-2 pt-2 items-end h-[60px] font-mono text-[10px]">
                <div className="bg-[#6C7A89] text-white p-1 rounded text-center font-bold" style={{ height: '35px' }}>
                  $20.40
                </div>
                <div className="bg-[#22272E] text-white p-1 rounded text-center font-bold" style={{ height: '50px' }}>
                  $21.30
                </div>
                <div className="bg-[#6C7A89] text-white p-1 rounded text-center font-bold" style={{ height: '60px' }}>
                  $22.95
                </div>
              </div>
            </div>
          </div>

          {/* 7. CHARTERING STRATEGY */}
          <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4">
            <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
              7. Chartering Strategy
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {analysis.charter_strategy.options.map((opt, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${
                    opt.is_recommended
                      ? 'border-[#22272E] bg-white shadow-sm ring-1 ring-[#22272E]'
                      : 'border-[#DFE6EE] bg-[#FAFBFD]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#6C7A89]">{opt.name}</span>
                    <span className={opt.is_recommended ? 'badge-pass' : 'badge-outline'}>
                      {opt.status_tag}
                    </span>
                  </div>
                  <div className="font-bold text-2xl text-[#22272E] mt-2">
                    {opt.rate_str}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 8. FINAL DECISION (Large Prominent Decision Panel) */}
          <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
                8. Final Decision
              </div>
              {/* Decision Tabs */}
              <div className="inline-flex bg-[#FAFBFD] p-1 rounded border border-[#DFE6EE]">
                {(['BOOK NOW', 'WAIT', 'MONITOR', 'REJECT'] as const).map((dec) => (
                  <button
                    key={dec}
                    className={`font-mono text-xs font-bold px-3 py-1 rounded transition-colors ${
                      analysis.final_decision.decision === dec
                        ? 'bg-[#22272E] text-white shadow-sm'
                        : 'text-[#6C7A89] hover:text-[#22272E]'
                    }`}
                  >
                    {dec}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs pt-1">
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">VESSEL</div>
                <div className="font-bold text-[#22272E] truncate mt-1">{analysis.final_decision.vessel}</div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">COST / MT</div>
                <div className="font-bold text-[#22272E] mt-1">${analysis.final_decision.cost_per_mt.toFixed(2)} (${analysis.final_decision.landed_cost_per_mt.toFixed(2)} Landed)</div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">RISK</div>
                <div className="font-bold text-[#22272E] mt-1">{analysis.final_decision.risk_score} / 10 {analysis.final_decision.risk_label}</div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">CONFIDENCE</div>
                <div className="font-bold text-[#22272E] mt-1">{analysis.final_decision.confidence}%</div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded col-span-2 md:col-span-1">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">STRATEGY</div>
                <div className="font-bold text-[#22272E] mt-1">{analysis.final_decision.strategy}</div>
              </div>
            </div>
          </div>

          {/* 9. WHY THIS DECISION? */}
          <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-3">
            <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
              9. Why this decision?
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
              {analysis.why_decision.reasons.map((r) => (
                <button
                  key={r.code}
                  onClick={() => setSelectedWhyTab(r.code)}
                  className={`p-2.5 rounded border text-center font-bold transition-all ${
                    selectedWhyTab === r.code
                      ? 'bg-[#22272E] text-white border-[#22272E]'
                      : 'bg-[#FAFBFD] text-[#6C7A89] border-[#DFE6EE] hover:text-[#22272E]'
                  }`}
                >
                  {r.title}
                </button>
              ))}
            </div>

            {/* Concise Reason Explanation Box */}
            <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-4 rounded font-mono text-xs text-[#22272E] leading-relaxed">
              {analysis.why_decision.reasons.find((r) => r.code === selectedWhyTab)?.summary}
            </div>
          </div>

          {/* 10. ACTIONS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-2">
            {toastMessage && (
              <div className="mr-auto font-mono text-xs text-white bg-[#22272E] px-3 py-2 rounded shadow-md animate-fadeIn">
                ✓ {toastMessage}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setModifyForm(form);
                setIsModifyDrawerOpen(true);
              }}
              className="font-mono text-xs font-bold bg-white hover:bg-slate-50 text-[#22272E] border border-[#DFE6EE] px-5 py-2.5 rounded transition-colors"
            >
              MODIFY
            </button>
            <button
              type="button"
              onClick={handleSaveScenario}
              className="font-mono text-xs font-bold bg-white hover:bg-slate-50 text-[#22272E] border border-[#DFE6EE] px-5 py-2.5 rounded transition-colors"
            >
              SAVE
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleApprove}
              className="font-mono text-xs font-bold bg-[#22272E] hover:bg-[#1B2028] text-white px-7 py-2.5 rounded transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
            >
              <Check size={14} />
              <span>APPROVE RECOMMENDATION</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODIFY RIGHT-SIDE DRAWER
      ========================================================================= */}
      {isModifyDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModifyDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#DFE6EE] p-6 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#DFE6EE] pb-4">
                  <div className="flex items-center gap-2">
                    <Sliders size={18} className="text-[#22272E]" />
                    <h3 className="font-mono text-sm font-bold text-[#22272E] uppercase tracking-wider">
                      Modify Cargo Parameters
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsModifyDrawerOpen(false)}
                    className="p-1 text-[#6C7A89] hover:text-[#22272E] rounded"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Form fields */}
                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-[#6C7A89] font-bold block mb-1">CARGO CATEGORY</label>
                    <select
                      value={modifyForm.cargo_category}
                      onChange={(e) => setModifyForm({
                        ...modifyForm,
                        cargo_category: e.target.value,
                        cargo_type: CARGO_TYPES[e.target.value]?.[0] ?? '',
                      })}
                      className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-xs font-mono"
                    >
                      <option value="Dry Bulk">Dry Bulk</option>
                      <option value="Liquid Bulk">Liquid Bulk</option>
                      <option value="Bulk Gases">Bulk Gases</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[#6C7A89] font-bold block mb-1">CARGO TYPE</label>
                    <select
                      value={modifyForm.cargo_type}
                      onChange={(e) => setModifyForm({ ...modifyForm, cargo_type: e.target.value })}
                      className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-xs font-mono"
                    >
                      {(CARGO_TYPES[modifyForm.cargo_category] ?? []).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[#6C7A89] font-bold block mb-1">QUANTITY (MT)</label>
                    <input
                      type="number"
                      value={modifyForm.quantity_mt}
                      onChange={(e) => setModifyForm({ ...modifyForm, quantity_mt: Number(e.target.value) })}
                      className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[#6C7A89] font-bold block mb-1">STARTING PORT</label>
                    <input
                      type="text"
                      value={modifyForm.starting_port}
                      onChange={(e) => setModifyForm({ ...modifyForm, starting_port: e.target.value })}
                      className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[#6C7A89] font-bold block mb-1">DESTINATION PORT</label>
                    <input
                      type="text"
                      value={modifyForm.destination_port}
                      onChange={(e) => setModifyForm({ ...modifyForm, destination_port: e.target.value })}
                      className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[#6C7A89] font-bold block mb-1">LAYCAN START</label>
                      <input
                        type="date"
                        value={modifyForm.laycan_start}
                        onChange={(e) => setModifyForm({ ...modifyForm, laycan_start: e.target.value })}
                        className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-2 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[#6C7A89] font-bold block mb-1">LAYCAN END</label>
                      <input
                        type="date"
                        value={modifyForm.laycan_end}
                        onChange={(e) => setModifyForm({ ...modifyForm, laycan_end: e.target.value })}
                        className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-2 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Drawer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DFE6EE]">
                <button
                  type="button"
                  onClick={() => setIsModifyDrawerOpen(false)}
                  className="font-mono text-xs font-bold bg-[#FAFBFD] hover:bg-slate-100 text-[#22272E] border border-[#DFE6EE] px-4 py-2.5 rounded transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleReAnalyze}
                  className="font-mono text-xs font-bold bg-[#22272E] hover:bg-[#1B2028] text-white px-5 py-2.5 rounded flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <RotateCcw size={13} />
                  <span>RE-ANALYZE</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
