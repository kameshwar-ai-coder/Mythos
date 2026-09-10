from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Vessel
from app.services.vessel_service import VesselService

router = APIRouter(prefix="/api/vessels", tags=["Vessels"])

@router.get("")
def get_vessels(db: Session = Depends(get_db)):
    vessels = db.query(Vessel).all()
    return vessels

@router.post("/analyze")
def analyze_vessels_endpoint(quantity_mt: float = 165000.0, db: Session = Depends(get_db)):
    return VesselService.analyze_vessels(db, quantity_mt=quantity_mt)
