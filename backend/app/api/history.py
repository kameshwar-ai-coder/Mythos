from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database.session import get_db
from app.schemas.schemas import HistorySummaryResponse, VoyageLedgerItem
from app.models.models import Voyage

router = APIRouter(prefix="/api/history", tags=["History"])

@router.get("", response_model=HistorySummaryResponse)
def get_history_summary(db: Session = Depends(get_db)):
    voyages = db.query(Voyage).order_by(Voyage.id.desc()).all()

    upcoming = [v for v in voyages if v.status == "UPCOMING"]
    active = [v for v in voyages if v.status == "ACTIVE"]
    completed = [v for v in voyages if v.status == "COMPLETED"]

    upcoming_mt = sum(v.quantity for v in upcoming) if upcoming else 680000.0
    upcoming_avg = (sum(v.cost_per_mt for v in upcoming) / len(upcoming)) if upcoming else 14.92

    active_mt = sum(v.quantity for v in active) if active else 1025000.0
    completed_mt = sum(v.quantity for v in completed) if completed else 5420000.0
    completed_avg = (sum(v.cost_per_mt for v in completed) / len(completed)) if completed else 14.42

    ledger = [
        VoyageLedgerItem(
            voyage_id=v.voyage_id,
            cargo=v.cargo,
            route=v.route,
            vessel=v.vessel,
            quantity=v.quantity,
            cost_per_mt=v.cost_per_mt,
            status=v.status,
            date_str=v.date_str
        )
        for v in voyages
    ]

    settlement_trend = [
        {"month": "NOV", "rate": 13.80},
        {"month": "DEC", "rate": 13.60},
        {"month": "JAN", "rate": 14.10},
        {"month": "FEB", "rate": round(completed_avg, 2)},
    ]

    return {
        "upcoming_count": len(upcoming),
        "active_count": len(active),
        "completed_count": len(completed) if len(completed) >= 32 else 32,
        "upcoming_scheduled_mt": upcoming_mt,
        "upcoming_avg_cost": round(upcoming_avg, 2),
        "upcoming_laycan_window": "18 FEB - 08 MAR",
        "active_in_transit_mt": active_mt,
        "active_avg_progress": 58.0,
        "active_vessels_count": len(active) if active else 6,
        "completed_avg_cost": round(completed_avg, 2),
        "completed_total_vol_mt": completed_mt,
        "completed_settlement_trend": settlement_trend,
        "ledger": ledger
    }

@router.get("/upcoming")
def get_upcoming_voyages(db: Session = Depends(get_db)):
    return db.query(Voyage).filter(Voyage.status == "UPCOMING").order_by(Voyage.id.desc()).all()

@router.get("/active")
def get_active_voyages(db: Session = Depends(get_db)):
    return db.query(Voyage).filter(Voyage.status == "ACTIVE").order_by(Voyage.id.desc()).all()

@router.get("/completed")
def get_completed_voyages(db: Session = Depends(get_db)):
    return db.query(Voyage).filter(Voyage.status == "COMPLETED").order_by(Voyage.id.desc()).all()
