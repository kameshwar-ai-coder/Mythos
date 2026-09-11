from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Port
from app.services.port_service import PortService
from app.services.vessel_service import VesselDatasetCache

router = APIRouter(prefix="/api/ports", tags=["Ports"])

@router.get("")
def get_ports(db: Session = Depends(get_db)):
    return db.query(Port).all()

@router.get("/options")
def get_port_options():
    _, in_df, int_df = VesselDatasetCache.get_datasets()
    
    india_ports = []
    if in_df is not None and not in_df.empty:
        records = in_df[['port', 'country']].drop_duplicates().sort_values(by='port').to_dict(orient='records')
        india_ports = [f"{r['port']}, {r['country']}" for r in records]
    else:
        india_ports = [
            "Dhamra, India",
            "Gangavaram, India",
            "Gopalpur, India",
            "Haldia, India",
            "Paradip, India",
            "Sagar-Sandheads, India",
            "Visakhapatnam, India"
        ]

    intl_ports = []
    if int_df is not None and not int_df.empty:
        records = int_df[['port', 'country']].drop_duplicates().sort_values(by=['country', 'port']).to_dict(orient='records')
        intl_ports = [f"{r['port']}, {r['country']}" for r in records]
    else:
        intl_ports = [
            "Fremantle Port, Australia",
            "Port Hedland, Australia",
            "Port of Adelaide, Australia",
            "Port of Brisbane, Australia",
            "Port of Darwin, Australia",
            "Port of Melbourne, Australia",
            "Port of Newcastle, Australia",
            "Port of Sydney / Port Botany, Australia",
            "Port of Belawan, Indonesia",
            "Port of Makassar, Indonesia",
            "Port of Tanjung Emas, Indonesia",
            "Port of Tanjung Perak, Indonesia",
            "Port of Tanjung Priok, Indonesia",
            "Port of Beira, Mozambique",
            "Port of Maputo, Mozambique",
            "Port of Nacala, Mozambique",
            "Port of Pemba, Mozambique",
            "Port of Quelimane, Mozambique",
            "Port of Murmansk, Russia",
            "Port of Novorossiysk, Russia",
            "Port of Primorsk, Russia",
            "Port of Saint Petersburg, Russia",
            "Port of Ust-Luga, Russia",
            "Port of Vladivostok, Russia",
            "Port of Vostochny, Russia",
            "Port of Houston, United States",
            "Port of Long Beach, United States",
            "Port of Los Angeles, United States",
            "Port of New York and New Jersey, United States",
            "Port of Savannah, United States"
        ]

    return {
        "india_ports": india_ports,
        "international_ports": intl_ports
    }

@router.post("/feasibility")
def get_port_feasibility(load_port: str = "Port of Newcastle", discharge_port: str = "Paradip", db: Session = Depends(get_db)):
    return PortService.evaluate_feasibility(db, load_port, discharge_port)
