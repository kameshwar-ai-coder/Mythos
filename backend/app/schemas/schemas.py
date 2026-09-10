from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Cargo Input Schemas
class CargoAnalyzeRequest(BaseModel):
    cargo_category: str = Field(default="Dry Bulk", description="Dry Bulk, Liquid Bulk, Bulk Gases")
    cargo_type: str = Field(default="Coking Coal (Prime Hard Metallurgical)")
    quantity_mt: float = Field(default=165000.0)
    starting_port: str = Field(default="Hay Point, AU (HAY)")
    destination_port: str = Field(default="Paradip, IN (PRT)")
    laycan_start: str = Field(default="2025-02-18")
    laycan_end: str = Field(default="2025-02-25")

# Freight Section Schema
class FreightTrendPoint(BaseModel):
    month: str
    rate: float
    is_forecast: bool = False

class FreightMarketData(BaseModel):
    freight_per_mt: float
    market_direction: str
    direction_symbol: str
    forecast_per_mt: float
    trend_history: List[FreightTrendPoint]

# Vessel Analysis Schema
class VesselComparisonItem(BaseModel):
    name: str
    dwt: float
    suitability: int
    built_year: Optional[int] = None
    vessel_class: Optional[str] = None
    rightship_score: Optional[float] = None

class VesselAnalysisData(BaseModel):
    recommended_vessel: str
    dwt: float
    suitability: int
    rightship_score: Optional[float] = None
    vessels_list: List[VesselComparisonItem]
    ml_prediction: Optional[Dict[str, Any]] = None

# Port Feasibility Schema
class PortConstraintItem(BaseModel):
    parameter: str
    loading_val: str
    loading_status: str # PASS, FAIL
    discharge_val: str
    discharge_status: str # PASS, FAIL

class PortFeasibilityData(BaseModel):
    loading_port: str
    discharge_port: str
    constraints: List[PortConstraintItem]

# Effective Cost Schema
class CostComponent(BaseModel):
    name: str
    amount: float
    percentage: float

class EffectiveCostData(BaseModel):
    freight: float
    bunker: float
    waiting: float
    misc: float
    total_cost_per_mt: float
    total_transport_cost: float
    breakdown: List[CostComponent]

# Risk Schema
class RiskItem(BaseModel):
    category: str
    score: float
    max_score: float = 10.0
    label: str

class RiskData(BaseModel):
    overall_score: float
    overall_label: str
    details: List[RiskItem]

# Scenarios Schema
class ScenarioItem(BaseModel):
    name: str
    probability_pct: int
    cost_per_mt: float

class ScenarioData(BaseModel):
    scenarios: List[ScenarioItem]

# Charter Strategy Schema
class StrategyOption(BaseModel):
    name: str
    rate_str: str
    status_tag: str # RECOMMENDED, ALTERNATIVE, NOT ADVISED
    is_recommended: bool

class CharterStrategyData(BaseModel):
    options: List[StrategyOption]

# Final Decision Schema
class DecisionData(BaseModel):
    decision: str # BOOK NOW, WAIT, MONITOR, REJECT
    vessel: str
    cost_per_mt: float
    landed_cost_per_mt: float
    risk_score: float
    risk_label: str
    confidence: int
    strategy: str

# Why Decision Schema
class WhyDecisionItem(BaseModel):
    code: str
    title: str
    summary: str

class WhyDecisionData(BaseModel):
    reasons: List[WhyDecisionItem]

# Comprehensive Cargo Analysis Response
class CargoAnalysisResponse(BaseModel):
    cargo_summary: Dict[str, Any]
    freight_market: FreightMarketData
    vessel_analysis: VesselAnalysisData
    port_feasibility: PortFeasibilityData
    effective_cost: EffectiveCostData
    risk_analysis: RiskData
    scenarios: ScenarioData
    charter_strategy: CharterStrategyData
    final_decision: DecisionData
    why_decision: WhyDecisionData

# Approval Schema
class ApproveDecisionRequest(BaseModel):
    cargo_type: str
    quantity_mt: float
    route: str
    vessel: str
    freight_rate: float
    cost_per_mt: float
    laycan_window: str
    destination_berth: Optional[str] = "CQ-1 / CQ-2 Mechanized Coal Berth"

class ApproveDecisionResponse(BaseModel):
    status: str
    fixture_id: str
    sign_off_id: str
    charter_party_code: str
    commodity_gateway: str
    scheduled_under: str
    laycan_countdown_days: int
    laycan_countdown_hours: int
    terminal_eta: str
    demurrage_rate: str
    despatch_rate: str
    hedging_model: str
    recap: Dict[str, Any]

# Market Data Schemas
class CurrentMarketResponse(BaseModel):
    freight_rate: float
    market_direction: str
    momentum: str
    confidence: int
    volatility_label: str
    volatility_pct: float
    volatility_index: int
    change_7d_avg: float

class MarketForecastHorizon(BaseModel):
    horizon_days: int
    date_str: str
    forecast_rate: float
    change_usd: float
    change_pct: float
    confidence_pct: int
    range_min: float
    range_max: float

class MarketHistoryItem(BaseModel):
    date: str
    route: str
    vessel_type: str
    cargo: str
    quantity: float
    rate_per_mt: float
    change_dod: str
    status: str

# History Ledger Schemas
class VoyageLedgerItem(BaseModel):
    voyage_id: str
    cargo: str
    route: str
    vessel: str
    quantity: float
    cost_per_mt: float
    status: str
    date_str: str

class HistorySummaryResponse(BaseModel):
    upcoming_count: int
    active_count: int
    completed_count: int
    upcoming_scheduled_mt: float
    upcoming_avg_cost: float
    upcoming_laycan_window: str
    active_in_transit_mt: float
    active_avg_progress: float
    active_vessels_count: int
    completed_avg_cost: float
    completed_total_vol_mt: float
    completed_settlement_trend: List[Dict[str, Any]]
    ledger: List[VoyageLedgerItem]

# Settings Schemas
class SettingsSchema(BaseModel):
    full_name: str
    role_title: str
    email_route: str
    reporting_currency: str
    spot_rate_alerts: bool
    port_congestion_alerts: bool
    vessel_availability_alerts: bool
    fixture_approvals_alerts: bool
    daily_digest_alerts: bool
    sms_urgent_dispatch: bool
    default_starting_screen: str
    display_density: str
    table_pagination_count: int
