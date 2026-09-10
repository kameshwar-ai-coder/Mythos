import csv
from pathlib import Path
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Vessel
from app.services.vessel_service import VesselService

router = APIRouter(prefix="/api/vessels", tags=["Vessels"])

@router.get("/cargo-options")
def get_cargo_options():
    dataset_path = Path(__file__).resolve().parents[3] / "data" / "cargo_vessel_dataset_50000.csv"
    options = {}
    with dataset_path.open(newline="", encoding="utf-8") as dataset_file:
        for row in csv.DictReader(dataset_file):
            category = row["cargo_category"]
            cargo_type = row["cargo_type"]
            options.setdefault(category, [])
            if cargo_type not in options[category]:
                options[category].append(cargo_type)
    return options

@router.get("")
def get_vessels(db: Session = Depends(get_db)):
    vessels = db.query(Vessel).all()
    return vessels

@router.post("/analyze")
def analyze_vessels_endpoint(quantity_mt: float = 165000.0, db: Session = Depends(get_db)):
    return VesselService.analyze_vessels(db, quantity_mt=quantity_mt)
