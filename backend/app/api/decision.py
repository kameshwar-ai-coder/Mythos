import uuid
import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import ApproveDecisionRequest, ApproveDecisionResponse
from app.models.models import Voyage, Recommendation, Port

router = APIRouter(prefix="/api/decision", tags=["Decision"])

@router.post("/approve", response_model=ApproveDecisionResponse)
def approve_recommendation(payload: ApproveDecisionRequest, db: Session = Depends(get_db)):
    # Generate unique fixture identifiers
    unique_suffix = str(db.query(Voyage).count() + 85).zfill(3)
    fixture_id = f"VYG-2025-{unique_suffix}"
    sign_off_id = f"FIX-AUTH-{uuid.uuid4().hex[:5].upper()}-EXP"
    charter_party_code = "AMWELSH93 / ASBATANKVOY DERIV"

    # Persist Recommendation
    rec = Recommendation(
        vessel_name=payload.vessel or "MV MARITIME FORTUNE",
        freight_rate=payload.freight_rate or 14.85,
        landed_cost_per_mt=payload.cost_per_mt or 21.30,
        total_freight_cost=(payload.freight_rate or 14.85) * (payload.quantity_mt or 165000),
        decision="BOOK NOW",
        confidence=92.0,
        risk_score=2.1,
        strategy="Spot Single Voyage",
        is_approved=True,
        fixture_id=fixture_id
    )
    db.add(rec)

    # Persist directly into Voyages ledger under UPCOMING
    new_voyage = Voyage(
        voyage_id=fixture_id,
        cargo=payload.cargo_type.split("(")[0].strip() if payload.cargo_type else "Coking Coal",
        route=payload.route if payload.route else "Hay Point → Paradip",
        vessel=payload.vessel if payload.vessel else "MV Maritime Fortune",
        quantity=payload.quantity_mt if payload.quantity_mt else 165000.0,
        cost_per_mt=payload.freight_rate if payload.freight_rate else 14.85,
        status="UPCOMING",
        date_str=payload.laycan_window or "18–25 Feb 2025",
        eta_str="08 Mar 2025",
        progress_pct=0.0
    )
    db.add(new_voyage)
    db.commit()

    total_freight_formatted = f"${int((payload.freight_rate or 14.85) * (payload.quantity_mt or 165000)):,}"

    recap_data = {
        "vessel_name": payload.vessel or "MV Maritime Fortune",
        "vessel_class": "Capesize • 181,200 DWT • Built 2019",
        "rightship_score": "5.0 / 5.0",
        "consignment": payload.cargo_type or "Coking Coal (Prime Hard Metallurgical)",
        "volume_tolerance": f"{int(payload.quantity_mt or 165000):,} MT ±10%",
        "stowage_factor": "43.5 cu.ft/LT",
        "discharge_corridor": payload.route or "Hay Point (AU) → Paradip (IN)",
        "freight_rate_display": f"${payload.freight_rate or 14.45:.2f} / MT",
        "total_freight": total_freight_formatted,
        "vs_spot": "-$0.40 vs spot benchmark",
        "laycan_window": payload.laycan_window or "18 FEB 2025 - 25 FEB 2025",
        "demurrage_despatch": "$28,500 / $14,250 pdpr",
        "hedging_model": "Prompt Fixed Rate + Singapore VLSFO Arbitrage Hedge",
        "voyage_risk": "2.1 / 10",
        "risk_tier": "TIER-1 LOW RISK",
        "metocean_corridor": "Optimal (Beaufort 3)",
        "paradip_congestion": "1.8 Days Queue (Avg)",
        "bunker_volatility": "Hedged (LSFO Swap)",
        "pi_club": "Gard AS (Unrestricted)",
        "agent": "GAC SHIPPING INDIA PVT LTD",
        "transit_estimate": "EST. 14.8 DAYS TRANSIT"
    }

    return {
        "status": "APPROVED",
        "fixture_id": fixture_id,
        "sign_off_id": sign_off_id,
        "charter_party_code": charter_party_code,
        "commodity_gateway": "PARADIP PORT AUTHORITY • COUNCIL VALIDATED",
        "scheduled_under": "HISTORY → UPCOMING [ACTIVE QUEUE]",
        "laycan_countdown_days": 4,
        "laycan_countdown_hours": 9,
        "terminal_eta": "08 MAR 2025",
        "demurrage_rate": "$28,500 pdpr",
        "despatch_rate": "$14,250 pdpr",
        "hedging_model": "Prompt Fixed Rate + Singapore VLSFO Arbitrage Hedge",
        "recap": recap_data
    }
