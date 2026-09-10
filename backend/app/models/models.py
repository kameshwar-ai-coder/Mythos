import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class Port(Base):
    __tablename__ = "ports"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True)
    name = Column(String(100), nullable=False)
    country = Column(String(100), default="India")
    is_east_coast_india = Column(Boolean, default=False)
    max_draft = Column(Float, nullable=False)   # meters
    max_loa = Column(Float, nullable=False)     # meters
    max_beam = Column(Float, nullable=False)    # meters
    max_dwt = Column(Float, nullable=False)     # MT
    average_congestion_days = Column(Float, default=1.8)
    berths = relationship("Berth", back_populates="port")

class Berth(Base):
    __tablename__ = "berths"

    id = Column(Integer, primary_key=True, index=True)
    port_id = Column(Integer, ForeignKey("ports.id"))
    name = Column(String(100), nullable=False)
    cargo_type = Column(String(100), default="Dry Bulk")
    max_draft = Column(Float, nullable=False)
    discharge_rate_per_day = Column(Float, default=25000.0) # MT/day

    port = relationship("Port", back_populates="berths")

class Vessel(Base):
    __tablename__ = "vessels"

    id = Column(Integer, primary_key=True, index=True)
    imo = Column(String(20), unique=True, index=True)
    name = Column(String(150), nullable=False)
    vessel_class = Column(String(50), nullable=False) # Capesize, Newcastlemax, Panamax, Supramax, Handysize
    built_year = Column(Integer, default=2019)
    dwt = Column(Float, nullable=False)
    draft = Column(Float, nullable=False)
    loa = Column(Float, nullable=False)
    beam = Column(Float, nullable=False)
    flag = Column(String(50), default="Marshall Islands")
    rightship_score = Column(Float, default=5.0) # 1.0 - 5.0
    current_location = Column(String(100), default="Hay Point")
    open_port = Column(String(100), default="Hay Point")
    available_from = Column(DateTime, default=datetime.datetime.utcnow)
    available_to = Column(DateTime, default=lambda: datetime.datetime.utcnow() + datetime.timedelta(days=30))
    daily_hire_rate = Column(Float, default=24500.0) # $/day
    fuel_consumption_laden = Column(Float, default=42.0) # MT/day
    fuel_consumption_ballast = Column(Float, default=32.0) # MT/day
    suitability_score = Column(Float, default=96.0)

class FreightRate(Base):
    __tablename__ = "freight_rates"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    route = Column(String(100), nullable=False) # e.g., "Hay Point -> Paradip" or "C5"
    vessel_type = Column(String(50), default="Capesize")
    cargo = Column(String(100), default="Coking Coal")
    quantity = Column(Float, default=165000.0)
    rate_per_mt = Column(Float, nullable=False)
    change_dod = Column(Float, default=0.0)
    status = Column(String(20), default="FIXED") # SPOT, FIXED, BENCHMARK

class PortCongestion(Base):
    __tablename__ = "port_congestion"

    id = Column(Integer, primary_key=True, index=True)
    port_name = Column(String(100), nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    queue_count = Column(Integer, default=5)
    waiting_days = Column(Float, default=1.8)
    weather_state = Column(String(50), default="Optimal (Beaufort 3)")

class CommodityPrice(Base):
    __tablename__ = "commodity_prices"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    commodity = Column(String(100), default="Coking Coal")
    price_usd_per_mt = Column(Float, default=240.0)
    bunker_vlsfo_usd = Column(Float, default=620.0)

class CargoRequirement(Base):
    __tablename__ = "cargo_requirements"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    cargo_category = Column(String(50), default="Dry Bulk")
    cargo_type = Column(String(100), nullable=False)
    quantity_mt = Column(Float, nullable=False)
    start_port = Column(String(100), nullable=False)
    destination_port = Column(String(100), nullable=False)
    laycan_start = Column(DateTime, nullable=False)
    laycan_end = Column(DateTime, nullable=False)
    status = Column(String(50), default="ANALYZED")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    cargo_requirement_id = Column(Integer, ForeignKey("cargo_requirements.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    vessel_name = Column(String(150), nullable=False)
    freight_rate = Column(Float, nullable=False)
    landed_cost_per_mt = Column(Float, nullable=False)
    total_freight_cost = Column(Float, nullable=False)
    decision = Column(String(50), default="BOOK NOW") # BOOK NOW, WAIT, MONITOR, REJECT
    confidence = Column(Float, default=92.0)
    risk_score = Column(Float, default=2.8)
    strategy = Column(String(100), default="Spot Single Voyage")
    is_approved = Column(Boolean, default=False)
    fixture_id = Column(String(100), nullable=True)
    details_json = Column(JSON, nullable=True)

class Voyage(Base):
    __tablename__ = "voyages"

    id = Column(Integer, primary_key=True, index=True)
    voyage_id = Column(String(50), unique=True, index=True)
    cargo = Column(String(100), nullable=False)
    route = Column(String(150), nullable=False)
    vessel = Column(String(150), nullable=False)
    quantity = Column(Float, nullable=False)
    cost_per_mt = Column(Float, nullable=False)
    status = Column(String(50), default="UPCOMING") # UPCOMING, ACTIVE, COMPLETED
    date_str = Column(String(50), default="18-25 Feb 2025")
    eta_str = Column(String(50), default="08 Mar 2025")
    progress_pct = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class UserSettings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), default="Capt. J. Vance")
    role_title = Column(String(150), default="Chief Charterer & Head of Procurement")
    email_route = Column(String(150), default="j.vance@sailfreight.intl")
    reporting_currency = Column(String(50), default="USD ($) — Standard Maritime")
    spot_rate_alerts = Column(Boolean, default=True)
    port_congestion_alerts = Column(Boolean, default=True)
    vessel_availability_alerts = Column(Boolean, default=True)
    fixture_approvals_alerts = Column(Boolean, default=True)
    daily_digest_alerts = Column(Boolean, default=False)
    sms_urgent_dispatch = Column(Boolean, default=False)
    default_starting_screen = Column(String(50), default="Dashboard")
    display_density = Column(String(50), default="High Density (Terminal)")
    table_pagination_count = Column(Integer, default=10)
