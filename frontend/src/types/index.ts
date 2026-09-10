export type NavigationPage = 'dashboard' | 'cargo' | 'market' | 'history' | 'settings';

export interface KpiCardProps {
  label: string;
  value: string;
  subValue?: string;
  statusBadge?: {
    text: string;
    variant?: 'optimal' | 'active' | 'rising' | 'saving' | 'action' | 'neutral';
  };
  icon?: string;
}

export interface CargoRequirementInput {
  cargo_category: string;
  cargo_type: string;
  quantity_mt: number;
  starting_port: string;
  destination_port: string;
  laycan_start: string;
  laycan_end: string;
}

export interface FreightTrendPoint {
  month: string;
  rate: number;
  is_forecast: boolean;
}

export interface FreightMarketData {
  freight_per_mt: number;
  market_direction: string;
  direction_symbol: string;
  forecast_per_mt: number;
  trend_history: FreightTrendPoint[];
}

export interface VesselComparisonItem {
  name: string;
  dwt: number;
  suitability: number;
  built_year?: number;
  vessel_class?: string;
  rightship_score?: number;
}

export interface VesselAnalysisData {
  recommended_vessel: string;
  dwt: number;
  suitability: number;
  rightship_score: number;
  vessels_list: VesselComparisonItem[];
}

export interface PortConstraintItem {
  parameter: string;
  loading_val: string;
  loading_status: string;
  discharge_val: string;
  discharge_status: string;
}

export interface PortFeasibilityData {
  loading_port: string;
  discharge_port: string;
  constraints: PortConstraintItem[];
}

export interface CostComponent {
  name: string;
  amount: number;
  percentage: number;
}

export interface EffectiveCostData {
  freight: number;
  bunker: number;
  waiting: number;
  misc: number;
  total_cost_per_mt: number;
  breakdown: CostComponent[];
}

export interface RiskItem {
  category: string;
  score: number;
  max_score: number;
  label: string;
}

export interface RiskData {
  overall_score: number;
  overall_label: string;
  details: RiskItem[];
}

export interface ScenarioItem {
  name: string;
  probability_pct: number;
  cost_per_mt: number;
}

export interface ScenarioData {
  scenarios: ScenarioItem[];
}

export interface StrategyOption {
  name: string;
  rate_str: string;
  status_tag: string;
  is_recommended: boolean;
}

export interface CharterStrategyData {
  options: StrategyOption[];
}

export interface DecisionData {
  decision: string;
  vessel: string;
  cost_per_mt: number;
  landed_cost_per_mt: number;
  risk_score: number;
  risk_label: string;
  confidence: number;
  strategy: string;
}

export interface WhyDecisionItem {
  code: string;
  title: string;
  summary: string;
}

export interface WhyDecisionData {
  reasons: WhyDecisionItem[];
}

export interface CargoAnalysisResponse {
  cargo_summary: {
    cargo_type: string;
    quantity: string;
    route: string;
    laycan: string;
  };
  freight_market: FreightMarketData;
  vessel_analysis: VesselAnalysisData;
  port_feasibility: PortFeasibilityData;
  effective_cost: EffectiveCostData;
  risk_analysis: RiskData;
  scenarios: ScenarioData;
  charter_strategy: CharterStrategyData;
  final_decision: DecisionData;
  why_decision: WhyDecisionData;
}

export interface ApproveDecisionRequest {
  cargo_type: string;
  quantity_mt: number;
  route: string;
  vessel: string;
  freight_rate: number;
  cost_per_mt: number;
  laycan_window: string;
  destination_berth?: string;
}

export interface ApproveDecisionResponse {
  status: string;
  fixture_id: string;
  sign_off_id: string;
  charter_party_code: string;
  commodity_gateway: string;
  scheduled_under: string;
  laycan_countdown_days: number;
  laycan_countdown_hours: number;
  terminal_eta: string;
  demurrage_rate: string;
  despatch_rate: string;
  hedging_model: string;
  recap: {
    vessel_name: string;
    vessel_class: string;
    rightship_score: string;
    consignment: string;
    volume_tolerance: string;
    stowage_factor: string;
    discharge_corridor: string;
    freight_rate_display: string;
    total_freight: string;
    vs_spot: string;
    laycan_window: string;
    demurrage_despatch: string;
    hedging_model: string;
    voyage_risk: string;
    risk_tier: string;
    metocean_corridor: string;
    paradip_congestion: string;
    bunker_volatility: string;
    pi_club: string;
    agent: string;
    transit_estimate: string;
  };
}

export interface CurrentMarketData {
  freight_rate: number;
  market_direction: string;
  momentum: string;
  confidence: number;
  volatility_label: string;
  volatility_pct: number;
  volatility_index: number;
  change_7d_avg: number;
}

export interface MarketHistoryItem {
  date: string;
  route: string;
  vessel_type: string;
  cargo: string;
  quantity: number;
  rate_per_mt: number;
  change_dod: string;
  status: string;
}

export interface VoyageLedgerItem {
  voyage_id: string;
  cargo: string;
  route: string;
  vessel: string;
  quantity: number;
  cost_per_mt: number;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  date_str: string;
}

export interface HistorySummaryData {
  upcoming_count: number;
  active_count: number;
  completed_count: number;
  upcoming_scheduled_mt: number;
  upcoming_avg_cost: number;
  upcoming_laycan_window: string;
  active_in_transit_mt: number;
  active_avg_progress: number;
  active_vessels_count: number;
  completed_avg_cost: number;
  completed_total_vol_mt: number;
  completed_settlement_trend: { month: string; rate: number }[];
  ledger: VoyageLedgerItem[];
}

export interface UserSettingsData {
  full_name: string;
  role_title: string;
  email_route: string;
  reporting_currency: string;
  spot_rate_alerts: boolean;
  port_congestion_alerts: boolean;
  vessel_availability_alerts: boolean;
  fixture_approvals_alerts: boolean;
  daily_digest_alerts: boolean;
  sms_urgent_dispatch: boolean;
  default_starting_screen: string;
  display_density: string;
  table_pagination_count: number;
}
