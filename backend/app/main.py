from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import Base, engine
from app.database.seed_data import init_db
from app.api import cargo, market, vessels, ports, decision, history, settings

from app.services.vessel_service import VesselDatasetCache
from app.services.freight_service import FreightDatasetCache

# Initialize database schema and seeds
Base.metadata.create_all(bind=engine)
init_db()

# Pre-warm ML and cargo datasets for instant query response
VesselDatasetCache.get_datasets()
FreightDatasetCache.load()

app = FastAPI(
    title="SAIL Freight Intelligence API",
    description="Intelligent Freight Forecasting & Vessel Chartering Decision-Support System for Bulk Cargo to the East Coast of India",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(cargo.router)
app.include_router(market.router)
app.include_router(vessels.router)
app.include_router(ports.router)
app.include_router(decision.router)
app.include_router(history.router)
app.include_router(settings.router)

@app.get("/")
def root():
    return {
        "status": "OPERATIONAL",
        "system": "SAIL FREIGHT INTELLIGENCE TERMINAL",
        "scope": "CORRIDOR // EAST COAST INDIA",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
