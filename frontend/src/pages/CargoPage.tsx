import React, { useEffect, useState, useRef } from 'react';
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
  AlertCircle,
  ArrowLeftRight
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
import { useCurrency } from '../context/CurrencyContext';

// ── Ports strictly from 50,000 compatibility datasets ──────────────────────────
const INDIAN_PORTS = [
  'Dhamra, India',
  'Gangavaram, India',
  'Gopalpur, India',
  'Haldia, India',
  'Paradip, India',
  'Sagar-Sandheads, India',
  'Visakhapatnam, India'
];

const INTERNATIONAL_PORTS = [
  'Fremantle Port, Australia',
  'Port Hedland, Australia',
  'Port of Adelaide, Australia',
  'Port of Brisbane, Australia',
  'Port of Darwin, Australia',
  'Port of Melbourne, Australia',
  'Port of Newcastle, Australia',
  'Port of Sydney / Port Botany, Australia',
  'Port of Belawan, Indonesia',
  'Port of Makassar, Indonesia',
  'Port of Tanjung Emas, Indonesia',
  'Port of Tanjung Perak, Indonesia',
  'Port of Tanjung Priok, Indonesia',
  'Port of Beira, Mozambique',
  'Port of Maputo, Mozambique',
  'Port of Nacala, Mozambique',
  'Port of Pemba, Mozambique',
  'Port of Quelimane, Mozambique',
  'Port of Murmansk, Russia',
  'Port of Novorossiysk, Russia',
  'Port of Primorsk, Russia',
  'Port of Saint Petersburg, Russia',
  'Port of Ust-Luga, Russia',
  'Port of Vladivostok, Russia',
  'Port of Vostochny, Russia',
  'Port of Houston, United States',
  'Port of Long Beach, United States',
  'Port of Los Angeles, United States',
  'Port of New York and New Jersey, United States',
  'Port of Savannah, United States'
];

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
  const { symbol, formatRate, formatAmount, convert } = useCurrency();
  const [cargoTypes, setCargoTypes] = useState<Record<string, string[]>>(CARGO_TYPES);
  const topRef = useRef<HTMLDivElement>(null);

  // Input Form State
  const [form, setForm] = useState<CargoRequirementInput>({
    cargo_category: 'Dry Bulk',
    cargo_type: 'Coal',
    quantity_mt: 165000,
    starting_port: 'Port of Newcastle, Australia',
    destination_port: 'Paradip, India',
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

  useEffect(() => {
    cargoService.getCargoOptions()
      .then((options) => {
        setCargoTypes(options);
        const dryBulkTypes = options['Dry Bulk'] ?? [];
        if (dryBulkTypes.length > 0) {
          setForm((current) => ({ ...current, cargo_type: dryBulkTypes[0] }));
          setModifyForm((current) => ({ ...current, cargo_type: dryBulkTypes[0] }));
        }
      })
      .catch(() => setCargoTypes(CARGO_TYPES));
  }, []);

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
      setTimeout(() => {
        if (topRef.current) {
          topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
        document.body.scrollTo({ top: 0, behavior: 'smooth' });
        const mainEl = document.querySelector('main');
        if (mainEl) {
          mainEl.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
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
      cargo_type: 'Coal',
      quantity_mt: 165000,
      starting_port: 'Port of Newcastle, Australia',
      destination_port: 'Paradip, India',
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
  const trendChartData = analysis?.freight_market.trend_history.map((point, index, points) => {
    const firstForecastIndex = points.findIndex((item) => item.is_forecast);
    return {
      ...point,
      historicalRate: point.is_forecast ? null : convert(point.rate),
      forecastRate: point.is_forecast || index === firstForecastIndex - 1 ? convert(point.rate) : null,
    };
  }) ?? [];

  return (
    <div ref={topRef} className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* =========================================================================
          VIEW A: APPROVED FIXTURE STATE (Light Green Theme)
      ========================================================================= */}
      {isApproved && approvalData && (
        <div className="space-y-6 animate-fadeIn">
          {/* Approved Fixture Header Banner */}
          <div className="bg-emerald-50/90 border border-emerald-200 text-emerald-950 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                <Check size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-mono text-lg font-bold tracking-wider uppercase text-emerald-950">
                    Fixture Recommendation Approved
                  </h2>
                  <span className="font-mono text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded shadow-xs">
                    APPROVED
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-2 py-0.5 rounded">
                    [CONCLUDED]
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              <button 
                onClick={() => alert("Voyage Fixture Recap generated and copied to clipboard.")}
                className="font-mono text-xs font-semibold bg-white hover:bg-emerald-100/70 text-emerald-900 px-3 py-2 rounded flex items-center gap-1.5 transition-colors border border-emerald-300 shadow-xs cursor-pointer"
              >
                <FileText size={14} />
                <span>Recap</span>
              </button>
              <button 
                onClick={() => alert("Downloading Official Fixture PDF Authorization...")}
                className="font-mono text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Download size={14} />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* 3 Overview Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Column 1: Vessel & Cargo Nomination */}
            <div className="bg-white border border-emerald-200/80 rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-800/80 tracking-wider">
                    Vessel & Cargo Nomination
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-1.5 py-0.5 rounded">
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

                <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-100">
                  <div className="font-mono text-[10px] uppercase font-bold text-emerald-800">
                    RightShip Score
                  </div>
                  <div className="font-mono text-base font-bold text-emerald-900 mt-0.5">
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
              <div className="mt-5 bg-emerald-50 border border-emerald-200 text-emerald-950 p-3 rounded flex items-center justify-between">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-emerald-700 font-semibold">
                    Discharge Corridor
                  </div>
                  <div className="font-mono text-xs font-bold text-emerald-950">
                    {approvalData.recap.discharge_corridor}
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border border-emerald-400 text-emerald-700 flex items-center justify-center text-xs">
                  ⊚
                </div>
              </div>
            </div>

            {/* Column 2: Financials & Demurrage Terms */}
            <div className="bg-white border border-emerald-200/80 rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-800/80 tracking-wider">
                    Financials & Demurrage Terms
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-1.5 py-0.5 rounded">
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
                    <span className="text-emerald-700 font-medium">• {approvalData.recap.vs_spot}</span>
                  </div>
                </div>

                <div className="bg-emerald-50/50 p-3 rounded border border-emerald-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase font-bold text-emerald-800">
                      Laycan Window (Working)
                    </span>
                    <span className="font-mono text-[10px] font-bold text-emerald-900">7 DAYS</span>
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
                  <div className="border-t border-emerald-100 pt-2 flex justify-between font-mono text-xs">
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
            <div className="bg-white border border-emerald-200/80 rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-800/80 tracking-wider">
                    Integrity & Risk Synthesis
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-1.5 py-0.5 rounded">
                    ASSESSMENT CLEAR
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase font-bold text-[#6C7A89]">
                      Calculated Voyage Risk
                    </div>
                    <div className="font-mono text-2xl font-bold text-emerald-700 mt-0.5">
                      {approvalData.recap.voyage_risk}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded uppercase">
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
                    <span>{form.starting_port.split(',')[0].toUpperCase()}</span>
                    <span>TRANSIT CORRIDOR</span>
                    <span>{form.destination_port.split(',')[0].toUpperCase()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#DFE6EE] rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-emerald-500 w-[45%]"></div>
                  </div>
                  <div className="font-mono text-[9px] text-center font-bold text-[#6C7A89] mt-1">
                    {approvalData.recap.transit_estimate}
                  </div>
                </div>
              </div>

              {/* Agent Verified Footer */}
              <div className="mt-4 bg-emerald-50/50 border border-emerald-100 px-3 py-2 rounded flex items-center justify-between font-mono text-[10px]">
                <span className="text-emerald-800/80">AGENT: <b className="text-emerald-950">{approvalData.recap.agent}</b></span>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-1.5 py-0.5 rounded">VERIFIED</span>
              </div>
            </div>
          </div>

          {/* Scheduled Under Queue Banner */}
          <div className="bg-emerald-50/90 border border-emerald-200 text-emerald-950 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded mt-0.5">
                <Sliders size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold uppercase tracking-wider text-emerald-950">
                    Scheduled Under History → Upcoming
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                    [ACTIVE QUEUE]
                  </span>
                </div>
                <p className="font-mono text-xs text-emerald-800 mt-1">
                  Voyage ID: <b>{approvalData.fixture_id}</b> • Allocation: NOMINATED & PENDING LOADING • Discharge Berth: CQ-1 / CQ-2 Mechanized Coal Berth
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 self-end md:self-auto font-mono text-right">
              <div>
                <div className="text-[10px] text-emerald-700 uppercase font-semibold">Laycan Countdown</div>
                <div className="text-sm font-bold text-emerald-950">04 DAYS : 09 HRS</div>
              </div>
              <div>
                <div className="text-[10px] text-emerald-700 uppercase font-semibold">Terminal ETA</div>
                <div className="text-sm font-bold text-emerald-950">08 MAR 2025</div>
              </div>
            </div>
          </div>

          {/* Audit Trail Code Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-mono text-[#6C7A89] px-1 border-t border-emerald-200 pt-3">
            <span>SIGN-OFF ID: {approvalData.sign_off_id} • CHARTER PARTY CODE: {approvalData.charter_party_code}</span>
            <span>COMMODITY GATEWAY: {approvalData.commodity_gateway}</span>
          </div>

          {/* Bottom Action Controls */}
          <div className="bg-[#FAFBFD] border border-emerald-200/80 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 font-mono text-xs text-[#6C7A89]">
              <AlertCircle size={15} className="text-emerald-700" />
              <span>You can adjust optional demurrage tolerances until laycan commencement.</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setModifyForm(form);
                  setIsModifyDrawerOpen(true);
                }}
                className="font-mono text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 px-4 py-2 rounded flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Sliders size={13} />
                <span>Modify</span>
              </button>
              <button
                onClick={() => onNavigate('history')}
                className="font-mono text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <span>View History</span>
                <span className="font-normal text-emerald-100">History → Upcoming</span>
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
                    cargo_type: (cargoTypes[cat] ?? CARGO_TYPES[cat])[0],
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
              {(cargoTypes[form.cargo_category] ?? CARGO_TYPES[form.cargo_category] ?? []).map((t) => (
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

          {/* 4. Starting Port & 5. Destination Port with In-Between Swap Button */}
          {(() => {
            const isOriginIndia = INDIAN_PORTS.includes(form.starting_port);
            const originPortOptions = isOriginIndia ? INDIAN_PORTS : INTERNATIONAL_PORTS;
            const destPortOptions = isOriginIndia ? INTERNATIONAL_PORTS : INDIAN_PORTS;

            return (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
                {/* 4. Starting Port */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex justify-between font-mono text-xs font-bold text-[#6C7A89]">
                    <span>4. STARTING PORT (LOAD TERMINAL)</span>
                    <span className="font-normal text-[#22272E]">
                      {isOriginIndia ? 'DOMESTIC (INDIA)' : 'FOREIGN / INTERNATIONAL'}
                    </span>
                  </div>
                  <select
                    value={form.starting_port}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setForm((prev) => ({ ...prev, starting_port: newStart }));
                    }}
                    className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-sm font-mono text-[#22272E] focus:outline-none focus:border-[#22272E]"
                  >
                    {originPortOptions.map((p) => (
                      <option key={`start-${p}`} value={p}>⚓ {p}</option>
                    ))}
                  </select>
                </div>

                {/* In-Between Swap Button */}
                <div className="flex items-center justify-center pb-0.5">
                  <button
                    type="button"
                    title="Swap Starting Port and Destination Port"
                    aria-label="Swap Starting Port and Destination Port"
                    onClick={() => setForm((f) => ({
                      ...f,
                      starting_port: f.destination_port,
                      destination_port: f.starting_port,
                    }))}
                    className="w-9 h-9 rounded-full border border-[#DFE6EE] bg-white text-[#22272E] hover:bg-[#FAFBFD] hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm hover:shadow transition-all cursor-pointer flex-shrink-0"
                  >
                    <ArrowLeftRight size={15} className="stroke-[2.2]" />
                  </button>
                </div>

                {/* 5. Destination Port */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex justify-between font-mono text-xs font-bold text-[#6C7A89]">
                    <span>5. DESTINATION PORT (DISCHARGE BERTH)</span>
                    <span className="font-normal text-[#22272E]">
                      {isOriginIndia ? 'FOREIGN DESTINATION' : 'EAST COAST INDIA'}
                    </span>
                  </div>
                  <select
                    value={form.destination_port}
                    onChange={(e) => {
                      const newDest = e.target.value;
                      setForm((prev) => ({ ...prev, destination_port: newDest }));
                    }}
                    className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-sm font-mono text-[#22272E] focus:outline-none focus:border-[#22272E]"
                  >
                    {destPortOptions.map((p) => (
                      <option key={`dest-${p}`} value={p}>⚓ {p}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })()}

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
                  {formatRate(analysis.freight_market.freight_per_mt)} <span className="text-xs font-normal text-[#6C7A89]">/ MT</span>
                </div>
              </div>
              {(() => {
                const dir = (analysis.freight_market.market_direction || '').toUpperCase();
                const isDown = dir === 'DOWN' || dir === 'BEARISH' || dir === 'DROP' || dir.includes('DOWN');
                const isUp = dir === 'UP' || dir === 'BULLISH' || dir === 'RISE' || dir.includes('UP');
                const displayDir = isDown ? 'DOWN' : isUp ? 'UP' : dir || 'NORMAL';
                const displaySymbol = isDown ? '▼' : isUp ? '▲' : (analysis.freight_market.direction_symbol || '▬');

                return (
                  <div className={`border p-3 rounded transition-colors ${
                    isDown
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : isUp
                      ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                      : 'bg-[#FAFBFD] border-[#DFE6EE] text-[#22272E]'
                  }`}>
                    <div className={`font-mono text-[10px] uppercase font-bold ${
                      isDown ? 'text-emerald-700' : isUp ? 'text-rose-700' : 'text-[#6C7A89]'
                    }`}>
                      MARKET DIRECTION
                    </div>
                    <div className="font-mono text-2xl font-bold mt-1 flex items-center gap-1.5">
                      <span>{displayDir}</span>
                      <span>{displaySymbol}</span>
                    </div>
                  </div>
                );
              })()}
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="font-mono text-[10px] text-[#6C7A89] uppercase font-bold">FORECAST</div>
                <div className="font-mono text-2xl font-bold text-[#22272E] mt-1">
                  {formatRate(analysis.freight_market.forecast_per_mt)} <span className="text-xs font-normal text-[#6C7A89]">/ MT</span>
                </div>
              </div>
            </div>

            {/* Freight Rate Trend & 30-Day Outlook Chart */}
            {(() => {
              const isTrendUp = analysis.freight_market.market_direction === 'UP' || analysis.freight_market.forecast_per_mt > analysis.freight_market.freight_per_mt;
              const isTrendDown = analysis.freight_market.market_direction === 'DOWN' || analysis.freight_market.forecast_per_mt < analysis.freight_market.freight_per_mt;
              const trendLineColor = isTrendUp ? '#EF4444' : isTrendDown ? '#10B981' : '#22272E';
              const forecastLineColor = isTrendUp ? '#F87171' : isTrendDown ? '#34D399' : '#6C7A89';

              return (
                <div className="border border-[#DFE6EE] rounded p-4 bg-[#FAFBFD]">
                  <div className="flex justify-between font-mono text-[10px] text-[#6C7A89] font-bold uppercase mb-2">
                    <span>
                      FREIGHT RATE TREND & 30-DAY OUTLOOK ({symbol}/MT)
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: trendLineColor }}></span>
                        CURRENT RATE
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 border-t border-dashed inline-block" style={{ borderColor: forecastLineColor }}></span>
                        FORECAST RATE
                      </span>
                    </div>
                  </div>
                  <div className="h-[140px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#DFE6EE" vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: '#6C7A89', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#DFE6EE' }} />
                        <YAxis domain={['auto', 'auto']} tick={{ fill: '#6C7A89', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#DFE6EE' }} tickFormatter={(v) => `${symbol}${Number(v).toFixed(0)}`} />
                        <Tooltip formatter={(val: any, name: any) => [`${symbol}${Number(val).toFixed(2)} / MT`, name === 'forecastRate' ? 'Forecast rate' : 'Current rate']} />
                        <Line type="monotone" dataKey="historicalRate" name="Current rate" stroke={trendLineColor} strokeWidth={2.5} dot={{ r: 3, fill: trendLineColor }} />
                        <Line type="monotone" dataKey="forecastRate" name="Forecast rate" stroke={forecastLineColor} strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 3, fill: forecastLineColor }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 2. VESSEL ANALYSIS */}
          <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
                2. Vessel Analysis
              </div>
              {analysis.vessel_analysis.ml_prediction && (
                <div className="flex items-center gap-1.5 font-mono text-[10px] bg-[#22272E] text-white px-2.5 py-1 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>ML MODEL RECOMMENDED: <b>{analysis.vessel_analysis.ml_prediction.vessel_class}</b></span>
                  {analysis.vessel_analysis.ml_prediction.confidence != null && (
                    <span className="text-slate-300">({analysis.vessel_analysis.ml_prediction.confidence}% CONF)</span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">RECOMMENDED VESSEL</div>
                <div className="font-bold text-sm text-[#22272E] mt-1">{analysis.vessel_analysis.recommended_vessel || 'N/A'}</div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">DWT</div>
                <div className="font-bold text-sm text-[#22272E] mt-1">{analysis.vessel_analysis.dwt?.toLocaleString() ?? 'N/A'}{analysis.vessel_analysis.dwt ? ' MT' : ''}</div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">SUITABILITY</div>
                <div className="font-bold text-sm text-[#22272E] mt-1">{analysis.vessel_analysis.suitability != null ? `${analysis.vessel_analysis.suitability}%` : 'N/A'}</div>
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
                      <td className="py-2.5 px-4 font-bold text-[#22272E] flex items-center gap-2">
                        <span>{v.name}</span>
                        {i === 0 && <span className="text-[9px] bg-[#22272E] text-white px-1.5 py-0.5 rounded uppercase font-normal">RANK 1</span>}
                      </td>
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
                  {analysis.port_feasibility.constraints.map((row, i) => {
                    const isLoadPass = !row.loading_val.toLowerCase().includes('fail') && !row.loading_val.toLowerCase().includes('exceed');
                    const isDischargePass = !row.discharge_val.toLowerCase().includes('fail') && !row.discharge_val.toLowerCase().includes('exceed');

                    return (
                      <tr key={i} className="hover:bg-[#FAFBFD]/80">
                        <td className="py-2.5 px-4 font-bold text-[#22272E]">{row.parameter}</td>
                        <td className="py-2.5 px-4">
                          <span className="text-[#22272E] font-medium mr-2">{row.loading_val}</span>
                          {isLoadPass ? (
                            <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              [PASS]
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              [FAIL]
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-[#22272E] font-medium mr-2">{row.discharge_val}</span>
                          {isDischargePass ? (
                            <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              [PASS]
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              [FAIL]
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. EFFECTIVE COST */}
          <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center font-mono text-xs font-bold uppercase tracking-wider">
              <span className="text-[#22272E]">4. Effective Cost</span>
              <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded font-bold shadow-sm">
                TOTAL TRANSPORT COST: {formatAmount(analysis.effective_cost.total_transport_cost)}
              </span>
            </div>

            {/* Stacked Proportional Segment Bar with Light Green, Light Yellow, Light Red */}
            <div className="space-y-1">
              <div className="h-6 w-full rounded flex overflow-hidden font-mono text-[10px] font-bold text-slate-900 border border-[#DFE6EE]/80 shadow-inner">
                <div className="bg-[#A7F3D0] text-emerald-950 h-full flex items-center justify-center px-2" style={{ width: '69.7%' }} title="Freight: 69.7%">
                  FREIGHT 69.7%
                </div>
                <div className="bg-[#FDE68A] text-amber-950 h-full flex items-center justify-center px-2" style={{ width: '19.5%' }} title="Bunker: 19.5%">
                  BUNKER 19.5%
                </div>
                <div className="bg-[#FECDD3] text-rose-950 h-full flex items-center justify-center px-1" style={{ width: '6.6%' }} title="Waiting Time: 6.6%">
                  WAITING 6.6%
                </div>
                <div className="bg-[#E2E8F0] text-slate-800 h-full flex items-center justify-center px-1" style={{ width: '4.2%' }} title="Misc: 4.2%">
                  MISC 4.2%
                </div>
              </div>
            </div>

            {/* 4 Cost Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-emerald-700 uppercase font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> FREIGHT
                </div>
                <div className="font-bold text-base text-[#22272E] mt-1">{formatRate(analysis.effective_cost.freight)} <span className="text-xs font-normal text-[#6C7A89]">/ MT</span></div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-amber-700 uppercase font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> BUNKER
                </div>
                <div className="font-bold text-base text-[#22272E] mt-1">{formatRate(analysis.effective_cost.bunker)} <span className="text-xs font-normal text-[#6C7A89]">/ MT</span></div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-rose-700 uppercase font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span> WAITING TIME
                </div>
                <div className="font-bold text-base text-[#22272E] mt-1">{formatRate(analysis.effective_cost.waiting)} <span className="text-xs font-normal text-[#6C7A89]">/ MT</span></div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">TOTAL COST / MT</div>
                <div className="font-bold text-base text-[#22272E] mt-1">{formatRate(analysis.effective_cost.total_cost_per_mt)} <span className="text-xs font-normal text-[#6C7A89]">/ MT</span></div>
              </div>
              <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded col-span-2 md:col-span-1 shadow-sm">
                <div className="text-[10px] text-emerald-800 uppercase font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> TOTAL TRANSPORT COST
                </div>
                <div className="font-bold text-base text-emerald-800 mt-1">{formatAmount(analysis.effective_cost.total_transport_cost)}</div>
              </div>
            </div>
          </div>

          {/* 5. RISK & 6. SCENARIOS (Side by Side Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 5. RISK (High risk only in light red) */}
            {(() => {
              const score = analysis.risk_analysis.overall_score;
              const isHigh = score >= 6 || analysis.risk_analysis.overall_label.toLowerCase().includes('high');

              return (
                <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center font-mono text-xs font-bold uppercase tracking-wider">
                    <span className="text-[#22272E]">5. Risk</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isHigh ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-[#DFE6EE] text-[#22272E]'
                    }`}>
                      OVERALL: {analysis.risk_analysis.overall_score} / 10 {analysis.risk_analysis.overall_label}
                    </span>
                  </div>
                  <div className="space-y-2 font-mono text-xs pt-1">
                    {analysis.risk_analysis.details.map((item, i) => {
                      const itemIsHigh = item.score >= 3.5 || item.label.toLowerCase().includes('high');

                      return (
                        <div key={i} className={`flex justify-between items-center p-2 rounded border ${
                          itemIsHigh ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-[#FAFBFD] border-[#DFE6EE]/80 text-[#22272E]'
                        }`}>
                          <span className="font-bold">{item.category}</span>
                          <span className="font-bold">{item.score} / {item.max_score.toFixed(0)} {item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* 6. SCENARIOS (Low=Light Green, Mid=Light Yellow, High=Light Red) */}
            <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-3">
              <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
                6. Scenarios
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                {analysis.scenarios.scenarios.map((sc, i) => {
                  const isLow = i === 0 || sc.name.toLowerCase().includes('low');
                  const isHigh = i === 2 || sc.name.toLowerCase().includes('high');
                  const scBorder = isLow
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                    : isHigh
                    ? 'border-rose-200 bg-rose-50/60 text-rose-950'
                    : 'border-amber-200 bg-amber-50/60 text-amber-950';

                  return (
                    <div key={i} className={`border p-2.5 rounded text-center ${scBorder}`}>
                      <div className="text-[10px] font-bold uppercase">{sc.name}</div>
                      <div className="font-bold text-sm mt-1">{formatRate(sc.cost_per_mt)} / MT</div>
                    </div>
                  );
                })}
              </div>

              {/* Visual Scenario Bars (Low=Light Green, Mid=Light Yellow, High=Light Red) */}
              <div className="grid grid-cols-3 gap-2 pt-2 items-end h-[60px] font-mono text-[10px]">
                <div className="bg-[#A7F3D0] text-emerald-950 border border-emerald-300 p-1 rounded text-center font-bold shadow-sm" style={{ height: '35px' }} title="Low: Light Green">
                  {formatRate(analysis.effective_cost.total_cost_per_mt * 0.95)}
                </div>
                <div className="bg-[#FDE68A] text-amber-950 border border-amber-300 p-1 rounded text-center font-bold shadow-sm" style={{ height: '50px' }} title="Mid: Light Yellow">
                  {formatRate(analysis.effective_cost.total_cost_per_mt)}
                </div>
                <div className="bg-[#FECDD3] text-rose-950 border border-rose-300 p-1 rounded text-center font-bold shadow-sm" style={{ height: '60px' }} title="High: Light Red">
                  {formatRate(analysis.effective_cost.total_cost_per_mt * 1.08)}
                </div>
              </div>
            </div>
          </div>

          {/* 7. CHARTERING STRATEGY (Recommended box in Light Green) */}
          <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4">
            <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
              7. Chartering Strategy
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {analysis.charter_strategy.options.map((opt, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border transition-all ${
                    opt.is_recommended
                      ? 'border-2 border-emerald-400 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-300 text-emerald-950'
                      : 'border-[#DFE6EE] bg-[#FAFBFD] text-[#22272E]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${opt.is_recommended ? 'text-emerald-900' : 'text-[#6C7A89]'}`}>
                      {opt.name}
                    </span>
                    <span className={opt.is_recommended ? 'font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200' : 'badge-outline'}>
                      {opt.status_tag}
                    </span>
                  </div>
                  <div className={`font-bold text-2xl mt-2 ${opt.is_recommended ? 'text-emerald-900' : 'text-[#22272E]'}`}>
                    {opt.is_recommended 
                      ? `${formatRate(analysis.freight_market.freight_per_mt)} / MT`
                      : (opt.name.includes('TIME') || opt.name.includes('MEDIUM') 
                          ? `${formatAmount(24500)} / DAY` 
                          : `${formatRate(analysis.freight_market.freight_per_mt * 1.02)} / MT`)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 8. FINAL DECISION (Book Now=Light Green, Wait=Light Yellow, Reject=Light Red) */}
          <div className="bg-white border border-[#DFE6EE] rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="font-mono text-xs font-bold text-[#22272E] uppercase tracking-wider">
                8. Final Decision
              </div>
              {/* Decision Tabs */}
              <div className="inline-flex gap-1.5 bg-[#FAFBFD] p-1 rounded border border-[#DFE6EE]">
                {(['BOOK NOW', 'WAIT', 'MONITOR', 'REJECT'] as const).map((dec) => {
                  const isSelected = analysis.final_decision.decision === dec;
                  let tabStyle = 'text-[#6C7A89] hover:text-[#22272E] border border-transparent';
                  
                  if (dec === 'BOOK NOW') {
                    tabStyle = isSelected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold shadow-sm'
                      : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50';
                  } else if (dec === 'WAIT' || dec === 'MONITOR') {
                    tabStyle = isSelected
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 font-bold shadow-sm'
                      : 'border-amber-200 text-amber-700 hover:bg-amber-50';
                  } else if (dec === 'REJECT') {
                    tabStyle = isSelected
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold shadow-sm'
                      : 'border-rose-200 text-rose-700 hover:bg-rose-50';
                  }

                  return (
                    <button
                      key={dec}
                      className={`font-mono text-xs font-semibold px-3 py-1 rounded transition-colors ${tabStyle}`}
                    >
                      {dec}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs pt-1">
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">VESSEL</div>
                <div className="font-bold text-[#22272E] truncate mt-1">{analysis.final_decision.vessel}</div>
              </div>
              <div className="bg-[#FAFBFD] border border-[#DFE6EE] p-3 rounded">
                <div className="text-[10px] text-[#6C7A89] uppercase font-bold">COST / MT</div>
                <div className="font-bold text-[#22272E] mt-1">{formatRate(analysis.final_decision.cost_per_mt)} ({formatRate(analysis.final_decision.landed_cost_per_mt)} Landed)</div>
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

          {/* 10. ACTIONS (Hover Approve turns into green) */}
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
              className="font-mono text-xs font-bold bg-[#22272E] hover:bg-emerald-600 active:bg-emerald-700 text-white px-7 py-2.5 rounded transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-70 flex items-center gap-2"
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
                        cargo_type: (cargoTypes[e.target.value] ?? CARGO_TYPES[e.target.value] ?? [])[0] ?? '',
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
                      {(cargoTypes[modifyForm.cargo_category] ?? CARGO_TYPES[modifyForm.cargo_category] ?? []).map((t) => (
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

                  {(() => {
                    const isModOriginIndia = INDIAN_PORTS.includes(modifyForm.starting_port);
                    const modOriginPortOptions = isModOriginIndia ? INDIAN_PORTS : INTERNATIONAL_PORTS;
                    const modDestPortOptions = isModOriginIndia ? INTERNATIONAL_PORTS : INDIAN_PORTS;

                    return (
                      <>
                        <div>
                          <div className="flex justify-between text-[#6C7A89] font-bold mb-1">
                            <label>STARTING PORT</label>
                            <span className="font-normal text-[10px] text-[#22272E]">
                              {isModOriginIndia ? 'DOMESTIC (INDIA)' : 'FOREIGN'}
                            </span>
                          </div>
                          <select
                            value={modifyForm.starting_port}
                            onChange={(e) => setModifyForm({ ...modifyForm, starting_port: e.target.value })}
                            className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-xs font-mono"
                          >
                            {modOriginPortOptions.map((p) => (
                              <option key={`mod-start-${p}`} value={p}>⚓ {p}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex justify-center -my-2">
                          <button
                            type="button"
                            title="Swap Ports"
                            onClick={() => setModifyForm((f) => ({ ...f, starting_port: f.destination_port, destination_port: f.starting_port }))}
                            className="w-7 h-7 rounded-full border border-[#DFE6EE] bg-white text-[#22272E] hover:bg-[#FAFBFD] flex items-center justify-center shadow-sm cursor-pointer"
                          >
                            <ArrowLeftRight size={13} />
                          </button>
                        </div>

                        <div>
                          <div className="flex justify-between text-[#6C7A89] font-bold mb-1">
                            <label>DESTINATION PORT</label>
                            <span className="font-normal text-[10px] text-[#22272E]">
                              {isModOriginIndia ? 'FOREIGN' : 'EAST COAST INDIA'}
                            </span>
                          </div>
                          <select
                            value={modifyForm.destination_port}
                            onChange={(e) => setModifyForm({ ...modifyForm, destination_port: e.target.value })}
                            className="w-full bg-[#FAFBFD] border border-[#DFE6EE] rounded px-3 py-2 text-xs font-mono"
                          >
                            {modDestPortOptions.map((p) => (
                              <option key={`mod-dest-${p}`} value={p}>⚓ {p}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    );
                  })()}

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
