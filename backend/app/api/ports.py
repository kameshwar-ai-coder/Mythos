from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Port
from app.services.port_service import PortService

router = APIRouter(prefix="/api/ports", tags=["Ports"])

@router.get("")
def get_ports(db: Session = Depends(get_db)):
    return db.query(Port).all()

@router.post("/feasibility")
def get_port_feasibility(load_port: str = "Hay Point", discharge_port: str = "Paradip", db: Session = Depends(get_db)):
    return PortService.evaluate_feasibility(db, load_port, discharge_port)
