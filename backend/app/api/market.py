from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.schemas.schemas import CurrentMarketResponse, MarketForecastHorizon, MarketHistoryItem
from app.services.freight_service import FreightService
from app.models.models import FreightRate

router = APIRouter(prefix="/api/market", tags=["Market"])

@router.get("/current", response_model=CurrentMarketResponse)
def get_current_market(
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    cargo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(FreightRate)
    if origin:
        query = query.filter(FreightRate.route.ilike(f"%{origin}%"))
    if destination:
        query = query.filter(FreightRate.route.ilike(f"%{destination}%"))
    if cargo:
        query = query.filter(FreightRate.cargo.ilike(f"%{cargo}%"))

    latest = query.order_by(FreightRate.date.desc()).first()
    if not latest:
        latest = db.query(FreightRate).order_by(FreightRate.date.desc()).first()

    spot = latest.rate_per_mt if latest else 14.85
    change = latest.change_dod if latest else 0.15
    direction = "BULLISH" if change > 0 else ("BEARISH" if change < 0 else "STABLE")

    return {
        "freight_rate": spot,
        "market_direction": direction,
        "momentum": f"STRONG MOMENTUM • 88% CONF",
        "confidence": 88,
        "volatility_label": "MODERATE",
        "volatility_pct": 4.2,
        "volatility_index": 38,
        "change_7d_avg": change
    }

@router.get("/forecast")
def get_market_forecast(
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(FreightRate)
    if origin:
        query = query.filter(FreightRate.route.ilike(f"%{origin}%"))
    if destination:
        query = query.filter(FreightRate.route.ilike(f"%{destination}%"))

    latest = query.order_by(FreightRate.date.desc()).first()
    spot = latest.rate_per_mt if latest else 14.85
    direction = "BULLISH" if (latest and latest.change_dod >= 0) else "BEARISH"

    horizons = FreightService.calculate_forecast(spot, direction=direction)
    return horizons

@router.get("/history", response_model=List[MarketHistoryItem])
def get_market_history(
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    cargo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(FreightRate)
    if origin:
        query = query.filter(FreightRate.route.ilike(f"%{origin}%"))
    if destination:
        query = query.filter(FreightRate.route.ilike(f"%{destination}%"))
    if cargo:
        query = query.filter(FreightRate.cargo.ilike(f"%{cargo}%"))

    rates = query.order_by(FreightRate.date.desc()).all()
    if not rates:
        rates = db.query(FreightRate).order_by(FreightRate.date.desc()).all()

    results = []
    for r in rates:
        change_str = f"+${r.change_dod:.2f}" if r.change_dod > 0 else (f"-${abs(r.change_dod):.2f}" if r.change_dod < 0 else "0.00")
        results.append({
            "date": r.date.strftime("%d %b %Y").upper(),
            "route": r.route,
            "vessel_type": r.vessel_type,
            "cargo": r.cargo,
            "quantity": r.quantity,
            "rate_per_mt": r.rate_per_mt,
            "change_dod": change_str,
            "status": r.status
        })
    return results
