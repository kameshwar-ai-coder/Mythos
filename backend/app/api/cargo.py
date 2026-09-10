import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import CargoAnalyzeRequest, CargoAnalysisResponse
from app.services.freight_service import FreightService
from app.services.vessel_service import VesselService
from app.services.port_service import PortService
from app.services.cost_service import CostService
from app.services.risk_service import RiskService
from app.services.scenario_service import ScenarioService
from app.services.strategy_service import StrategyService
from app.services.decision_service import DecisionService
from app.models.models import CargoRequirement, Recommendation

router = APIRouter(prefix="/api/cargo", tags=["Cargo"])

@router.post("/analyze", response_model=CargoAnalysisResponse)
def analyze_cargo(payload: CargoAnalyzeRequest, db: Session = Depends(get_db)):
    # 1. Save / Record Cargo Requirement in Database
    try:
        laycan_s = datetime.datetime.strptime(payload.laycan_start, "%Y-%m-%d")
        laycan_e = datetime.datetime.strptime(payload.laycan_end, "%Y-%m-%d")
    except Exception:
        laycan_s = datetime.datetime.utcnow()
        laycan_e = laycan_s + datetime.timedelta(days=7)

    cargo_req = CargoRequirement(
        cargo_category=payload.cargo_category,
        cargo_type=payload.cargo_type,
        quantity_mt=payload.quantity_mt,
        start_port=payload.starting_port,
        destination_port=payload.destination_port,
        laycan_start=laycan_s,
        laycan_end=laycan_e,
        status="ANALYZED"
    )
    db.add(cargo_req)
    db.commit()
    db.refresh(cargo_req)

    # 2. Freight Market Data from Database
    freight_info = FreightService.get_route_spot_and_trend(
        db,
        start_port_str=payload.starting_port,
        dest_port_str=payload.destination_port,
        cargo_type=payload.cargo_type
    )

    freight_market = {
        "freight_per_mt": freight_info["spot_rate"],
        "market_direction": freight_info["direction"],
        "direction_symbol": freight_info["direction_symbol"],
        "forecast_per_mt": freight_info["forecast_rate"],
        "trend_history": freight_info["trend_history"]
    }

    # 3. Vessel Analysis from Database
    vessel_data = VesselService.analyze_vessels(
        db,
        quantity_mt=payload.quantity_mt,
        category=payload.cargo_category,
        cargo_type=payload.cargo_type,
        destination_port_str=payload.destination_port
    )

    # 4. Port Feasibility Matrix
    port_feasibility = PortService.evaluate_feasibility(
        db,
        load_port_str=payload.starting_port,
        discharge_port_str=payload.destination_port,
        vessel_dict=vessel_data["top_vessel_obj"],
        quantity_mt=payload.quantity_mt
    )

    # 5. Effective Landed Cost Calculation
    effective_cost = CostService.calculate_effective_cost(
        db,
        freight_rate=freight_info["spot_rate"],
        quantity_mt=payload.quantity_mt,
        dest_port_str=payload.destination_port,
        daily_hire=vessel_data["top_vessel_obj"].get("daily_hire_rate", 24500.0)
    )

    # 6. Risk Analysis
    risk_analysis = RiskService.evaluate_risks(
        waiting_days=effective_cost["waiting_days"],
        rightship_score=vessel_data.get("rightship_score", 5.0),
        market_direction=freight_info["direction"],
        port_feasible=port_feasibility["all_passed"]
    )

    # 7. Scenario Analysis
    scenarios = ScenarioService.get_scenarios(base_cost=effective_cost["total_cost_per_mt"])

    # 8. Chartering Strategy
    charter_strategy = StrategyService.get_charter_strategies(spot_rate=freight_info["spot_rate"])

    # 9. Final Decision & 10. Why Decision
    final_decision, why_decision = DecisionService.evaluate_final_decision(
        freight_rate=freight_info["spot_rate"],
        landed_cost=effective_cost["total_cost_per_mt"],
        vessel_name=vessel_data["recommended_vessel"],
        vessel_suitability=vessel_data["suitability"],
        port_feasible=port_feasibility["all_passed"],
        market_direction=freight_info["direction"],
        overall_risk_score=risk_analysis["overall_score"],
        quantity_mt=payload.quantity_mt,
        waiting_days=effective_cost["waiting_days"],
        ml_prediction=vessel_data.get("ml_prediction")
    )

    # Clean formatted cargo summary
    cargo_summary = {
        "cargo_type": payload.cargo_type.split("(")[0].strip(),
        "quantity": f"{int(payload.quantity_mt):,} MT",
        "route": f"{payload.starting_port.split(',')[0].strip()} → {payload.destination_port.split(',')[0].strip()}",
        "laycan": f"{laycan_s.strftime('%d').lstrip('0')}–{laycan_e.strftime('%d %b %Y').upper()}"
    }

    return {
        "cargo_summary": cargo_summary,
        "freight_market": freight_market,
        "vessel_analysis": {
            "recommended_vessel": vessel_data["recommended_vessel"],
            "dwt": vessel_data["dwt"],
            "suitability": vessel_data["suitability"],
            "rightship_score": vessel_data["rightship_score"],
            "ml_prediction": vessel_data.get("ml_prediction"),
            "vessels_list": vessel_data["vessels_list"]
        },
        "port_feasibility": {
            "loading_port": port_feasibility["loading_port"],
            "discharge_port": port_feasibility["discharge_port"],
            "constraints": port_feasibility["constraints"]
        },
        "effective_cost": {
            "freight": effective_cost["freight"],
            "bunker": effective_cost["bunker"],
            "waiting": effective_cost["waiting"],
            "misc": effective_cost["misc"],
            "total_cost_per_mt": effective_cost["total_cost_per_mt"],
            "total_transport_cost": effective_cost["total_transport_cost"],
            "breakdown": effective_cost["breakdown"]
        },
        "risk_analysis": risk_analysis,
        "scenarios": scenarios,
        "charter_strategy": charter_strategy,
        "final_decision": final_decision,
        "why_decision": why_decision
    }

@router.post("/save")
def save_cargo_scenario(payload: dict, db: Session = Depends(get_db)):
    rec = Recommendation(
        vessel_name=payload.get("vessel_name", "MV Maritime Fortune"),
        freight_rate=payload.get("freight_rate", 14.85),
        landed_cost_per_mt=payload.get("landed_cost_per_mt", 21.30),
        total_freight_cost=payload.get("freight_rate", 14.85) * payload.get("quantity_mt", 165000),
        decision=payload.get("decision", "BOOK NOW"),
        confidence=payload.get("confidence", 92.0),
        risk_score=payload.get("risk_score", 2.8),
        strategy=payload.get("strategy", "Spot Single Voyage"),
        details_json=payload
    )
    db.add(rec)
    db.commit()
    return {"status": "SUCCESS", "message": "Cargo scenario saved successfully to database."}
