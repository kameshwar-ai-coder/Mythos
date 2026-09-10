import datetime
from app.database.session import SessionLocal, engine, Base
from app.models.models import Port, Berth, Vessel, FreightRate, PortCongestion, CommodityPrice, Voyage, UserSettings

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(Port).first():
        db.close()
        return

    print("Seeding comprehensive maritime dataset...")

    # Ports
    ports_data = [
        # East Coast India Ports
        Port(code="PRT", name="Paradip", country="India", is_east_coast_india=True, max_draft=17.10, max_loa=300.0, max_beam=48.0, max_dwt=200000.0, average_congestion_days=1.8),
        Port(code="VTZ", name="Visakhapatnam", country="India", is_east_coast_india=True, max_draft=18.10, max_loa=300.0, max_beam=48.0, max_dwt=200000.0, average_congestion_days=2.1),
        Port(code="GGV", name="Gangavaram", country="India", is_east_coast_india=True, max_draft=18.50, max_loa=320.0, max_beam=50.0, max_dwt=200000.0, average_congestion_days=1.2),
        Port(code="GPL", name="Gopalpur", country="India", is_east_coast_india=True, max_draft=14.50, max_loa=225.0, max_beam=32.2, max_dwt=80000.0, average_congestion_days=1.0),
        Port(code="DHM", name="Dhamra", country="India", is_east_coast_india=True, max_draft=18.00, max_loa=320.0, max_beam=50.0, max_dwt=207000.0, average_congestion_days=1.5),
        Port(code="HLD", name="Haldia", country="India", is_east_coast_india=True, max_draft=8.50, max_loa=190.0, max_beam=30.0, max_dwt=45000.0, average_congestion_days=3.5),
        Port(code="SND", name="Sagar / Sandheads", country="India", is_east_coast_india=True, max_draft=14.00, max_loa=245.0, max_beam=36.0, max_dwt=95000.0, average_congestion_days=2.0),

        # Major Global Origins
        Port(code="HAY", name="Hay Point", country="Australia", is_east_coast_india=False, max_draft=18.50, max_loa=300.0, max_beam=47.0, max_dwt=220000.0, average_congestion_days=2.5),
        Port(code="GLD", name="Gladstone", country="Australia", is_east_coast_india=False, max_draft=18.20, max_loa=300.0, max_beam=48.0, max_dwt=220000.0, average_congestion_days=2.0),
        Port(code="NWC", name="Newcastle", country="Australia", is_east_coast_india=False, max_draft=16.20, max_loa=300.0, max_beam=47.0, max_dwt=180000.0, average_congestion_days=3.0),
        Port(code="PHD", name="Port Hedland", country="Australia", is_east_coast_india=False, max_draft=19.00, max_loa=330.0, max_beam=55.0, max_dwt=260000.0, average_congestion_days=1.5),
        Port(code="ORF", name="Norfolk (Hampton Roads)", country="United States", is_east_coast_india=False, max_draft=15.20, max_loa=300.0, max_beam=45.0, max_dwt=180000.0, average_congestion_days=3.8),
        Port(code="RCB", name="Richards Bay", country="South Africa", is_east_coast_india=False, max_draft=17.50, max_loa=300.0, max_beam=47.0, max_dwt=200000.0, average_congestion_days=2.2),
        Port(code="MPM", name="Maputo", country="Mozambique", is_east_coast_india=False, max_draft=14.20, max_loa=225.0, max_beam=32.2, max_dwt=80000.0, average_congestion_days=2.7),
        Port(code="SMD", name="Samarinda (Muara Berau)", country="Indonesia", is_east_coast_india=False, max_draft=15.00, max_loa=230.0, max_beam=34.0, max_dwt=85000.0, average_congestion_days=4.2),
        Port(code="TBR", name="Tanjung Bara", country="Indonesia", is_east_coast_india=False, max_draft=17.50, max_loa=300.0, max_beam=48.0, max_dwt=180000.0, average_congestion_days=2.0),
        Port(code="VVO", name="Vanino / Vostochny", country="Russia", is_east_coast_india=False, max_draft=16.50, max_loa=290.0, max_beam=45.0, max_dwt=175000.0, average_congestion_days=3.1),
    ]
    db.add_all(ports_data)
    db.commit()

    # Berths for East Coast India Ports
    for p in ports_data:
        prt = db.query(Port).filter(Port.code == p.code).first()
        if not prt:
            continue
        if prt.code == "PRT":
            db.add_all([
                Berth(port_id=prt.id, name="CQ-1 / CQ-2 Mechanized Coal Berth", cargo_type="Coking Coal", max_draft=17.10, discharge_rate_per_day=30000.0),
                Berth(port_id=prt.id, name="IOB Iron Ore Berth", cargo_type="Iron Ore", max_draft=17.10, discharge_rate_per_day=35000.0),
                Berth(port_id=prt.id, name="General Cargo Berth (GCB)", cargo_type="Dry Bulk", max_draft=14.50, discharge_rate_per_day=18000.0),
            ])
        elif prt.code == "VTZ":
            db.add_all([
                Berth(port_id=prt.id, name="EQ-1 / EQ-2 Coal Berth", cargo_type="Coking Coal", max_draft=18.10, discharge_rate_per_day=28000.0),
                Berth(port_id=prt.id, name="WQ-4 General Bulk", cargo_type="Dry Bulk", max_draft=14.50, discharge_rate_per_day=16000.0),
            ])
        elif prt.code == "GGV":
            db.add_all([
                Berth(port_id=prt.id, name="Berth 1 Deepwater Mechanized", cargo_type="Dry Bulk", max_draft=18.50, discharge_rate_per_day=35000.0),
            ])
        elif prt.code == "HLD":
            db.add_all([
                Berth(port_id=prt.id, name="Berth 4B Finger Jetty", cargo_type="Dry Bulk", max_draft=8.50, discharge_rate_per_day=12000.0),
            ])
        elif prt.code == "DHM":
            db.add_all([
                Berth(port_id=prt.id, name="Berth 1 Dry Bulk Terminal", cargo_type="Dry Bulk", max_draft=18.00, discharge_rate_per_day=32000.0),
            ])
        elif prt.code == "GPL":
            db.add_all([
                Berth(port_id=prt.id, name="Berth 1 Multi-purpose", cargo_type="Dry Bulk", max_draft=14.50, discharge_rate_per_day=15000.0),
            ])
    db.commit()

    # Port Congestion records
    congestion_records = [
        PortCongestion(port_name="Paradip", queue_count=5, waiting_days=1.8, weather_state="Optimal (Beaufort 3)"),
        PortCongestion(port_name="Visakhapatnam", queue_count=6, waiting_days=2.1, weather_state="Moderate Swell (Beaufort 4)"),
        PortCongestion(port_name="Gangavaram", queue_count=3, waiting_days=1.2, weather_state="Optimal (Beaufort 2)"),
        PortCongestion(port_name="Gopalpur", queue_count=2, waiting_days=1.0, weather_state="Optimal (Beaufort 3)"),
        PortCongestion(port_name="Dhamra", queue_count=4, waiting_days=1.5, weather_state="Optimal (Beaufort 3)"),
        PortCongestion(port_name="Haldia", queue_count=9, waiting_days=3.5, weather_state="Tidal River Constrained"),
        PortCongestion(port_name="Sagar / Sandheads", queue_count=4, waiting_days=2.0, weather_state="Transshipment Anchor"),
    ]
    db.add_all(congestion_records)

    # Commodity Prices
    commodity_records = [
        CommodityPrice(commodity="Coking Coal (Prime Hard Metallurgical)", price_usd_per_mt=245.0, bunker_vlsfo_usd=620.0),
        CommodityPrice(commodity="Thermal Coal (High GCV 6000 kcal)", price_usd_per_mt=135.0, bunker_vlsfo_usd=620.0),
        CommodityPrice(commodity="Iron Ore Fines (Fe 62%)", price_usd_per_mt=118.0, bunker_vlsfo_usd=620.0),
        CommodityPrice(commodity="Limestone / Dolomite Flux", price_usd_per_mt=48.0, bunker_vlsfo_usd=620.0),
        CommodityPrice(commodity="Bauxite / Alumina", price_usd_per_mt=72.0, bunker_vlsfo_usd=620.0),
    ]
    db.add_all(commodity_records)

    # Candidate Vessels across all classes
    vessels = [
        # Capesize (160k - 185k DWT)
        Vessel(imo="9842101", name="MV Maritime Fortune", vessel_class="Capesize", built_year=2019, dwt=181240.0, draft=18.20, loa=292.0, beam=45.0, flag="Marshall Islands", rightship_score=5.0, current_location="Hay Point", open_port="Hay Point, AU", daily_hire_rate=24500.0, suitability_score=96.0),
        Vessel(imo="9835402", name="MV Ocean Pioneer", vessel_class="Capesize", built_year=2018, dwt=178500.0, draft=18.10, loa=292.0, beam=45.0, flag="Panama", rightship_score=4.5, current_location="Gladstone", open_port="Gladstone, AU", daily_hire_rate=23800.0, suitability_score=84.0),
        Vessel(imo="9791103", name="MV Pacific Bulk", vessel_class="Capesize", built_year=2017, dwt=180100.0, draft=18.25, loa=292.0, beam=45.0, flag="Liberia", rightship_score=4.0, current_location="Newcastle", open_port="Newcastle, AU", daily_hire_rate=24000.0, suitability_score=71.0),
        Vessel(imo="9891234", name="MV Pacific Prosper", vessel_class="Capesize", built_year=2021, dwt=170000.0, draft=17.80, loa=289.0, beam=45.0, flag="Singapore", rightship_score=5.0, current_location="Gladstone", open_port="Gladstone, AU", daily_hire_rate=25000.0, suitability_score=92.0),
        Vessel(imo="9811009", name="MV Capesize Apex", vessel_class="Capesize", built_year=2020, dwt=165000.0, draft=17.60, loa=288.0, beam=45.0, flag="Singapore", rightship_score=5.0, current_location="Hay Point", open_port="Hay Point, AU", daily_hire_rate=24200.0, suitability_score=95.0),
        Vessel(imo="9756112", name="MV Golden Voyager", vessel_class="Capesize", built_year=2016, dwt=165000.0, draft=17.50, loa=285.0, beam=45.0, flag="Panama", rightship_score=4.0, current_location="Hay Point", open_port="Hay Point, AU", daily_hire_rate=23000.0, suitability_score=88.0),
        Vessel(imo="9734567", name="MV East Bulk", vessel_class="Capesize", built_year=2016, dwt=150000.0, draft=17.00, loa=280.0, beam=44.0, flag="Liberia", rightship_score=4.0, current_location="Newcastle", open_port="Newcastle, AU", daily_hire_rate=22500.0, suitability_score=82.0),
        Vessel(imo="9687654", name="MV Indian Bulk", vessel_class="Capesize", built_year=2015, dwt=165000.0, draft=17.50, loa=285.0, beam=45.0, flag="India", rightship_score=4.5, current_location="Hay Point", open_port="Hay Point, AU", daily_hire_rate=23500.0, suitability_score=90.0),

        # Newcastlemax (185k - 210k DWT)
        Vessel(imo="9912045", name="MV Iron Leader", vessel_class="Newcastlemax", built_year=2022, dwt=205000.0, draft=18.50, loa=299.9, beam=50.0, flag="Hong Kong", rightship_score=5.0, current_location="Port Hedland", open_port="Port Hedland, AU", daily_hire_rate=26500.0, suitability_score=94.0),
        Vessel(imo="9924810", name="MV Eastern Titan", vessel_class="Newcastlemax", built_year=2023, dwt=208000.0, draft=18.60, loa=299.9, beam=50.0, flag="Panama", rightship_score=5.0, current_location="Port Hedland", open_port="Port Hedland, AU", daily_hire_rate=27000.0, suitability_score=91.0),

        # Post-Panamax / Kamsarmax (80k - 85k DWT)
        Vessel(imo="9871122", name="MV Kamsarmax Leader", vessel_class="Kamsarmax", built_year=2020, dwt=82500.0, draft=14.50, loa=229.0, beam=32.26, flag="Marshall Islands", rightship_score=4.5, current_location="Richards Bay", open_port="Richards Bay, ZA", daily_hire_rate=18500.0, suitability_score=86.0),

        # Panamax (65k - 78k DWT)
        Vessel(imo="9643190", name="MV Southern Cross", vessel_class="Panamax", built_year=2015, dwt=75000.0, draft=14.20, loa=225.0, beam=32.2, flag="Bahamas", rightship_score=4.5, current_location="Gladstone", open_port="Gladstone, AU", daily_hire_rate=17500.0, suitability_score=78.0),
        Vessel(imo="9655432", name="MV Bengal Trader", vessel_class="Panamax", built_year=2016, dwt=76000.0, draft=14.30, loa=225.0, beam=32.2, flag="India", rightship_score=4.0, current_location="Samarinda", open_port="Samarinda, ID", daily_hire_rate=16800.0, suitability_score=75.0),

        # Supramax / Ultramax (55k - 64k DWT)
        Vessel(imo="9712398", name="MV Ultra Horizon", vessel_class="Ultramax", built_year=2019, dwt=63500.0, draft=13.30, loa=199.9, beam=32.2, flag="Singapore", rightship_score=4.5, current_location="Samarinda", open_port="Samarinda, ID", daily_hire_rate=15200.0, suitability_score=79.0),

        # Handysize (32k - 40k DWT) - Haldia Compatible
        Vessel(imo="9587654", name="MV Ganga Pioneer", vessel_class="Handysize", built_year=2014, dwt=38500.0, draft=8.40, loa=180.0, beam=29.8, flag="India", rightship_score=4.0, current_location="Haldia", open_port="Haldia, IN", daily_hire_rate=12500.0, suitability_score=85.0),
    ]
    db.add_all(vessels)

    # Historical Freight Rates across routes
    freight_rates = [
        # Australia -> Paradip (Capesize)
        FreightRate(date=datetime.datetime(2025, 2, 14), route="Hay Point -> Paradip", vessel_type="Capesize", cargo="Coking Coal", quantity=165000.0, rate_per_mt=14.85, change_dod=0.15, status="SPOT"),
        FreightRate(date=datetime.datetime(2025, 2, 13), route="Hay Point -> Paradip", vessel_type="Capesize", cargo="Coking Coal", quantity=160000.0, rate_per_mt=14.70, change_dod=0.10, status="FIXED"),
        FreightRate(date=datetime.datetime(2025, 2, 12), route="Gladstone -> Paradip", vessel_type="Capesize", cargo="Coking Coal", quantity=170000.0, rate_per_mt=14.60, change_dod=0.05, status="FIXED"),
        FreightRate(date=datetime.datetime(2025, 2, 11), route="Port Hedland -> Dhamra", vessel_type="Newcastlemax", cargo="Iron Ore", quantity=185000.0, rate_per_mt=10.15, change_dod=0.00, status="FIXED"),
        FreightRate(date=datetime.datetime(2025, 2, 10), route="Hay Point -> Paradip", vessel_type="Capesize", cargo="Coking Coal", quantity=165000.0, rate_per_mt=14.55, change_dod=0.20, status="FIXED"),
        FreightRate(date=datetime.datetime(2025, 2, 7), route="Hay Point -> Paradip", vessel_type="Capesize", cargo="Coking Coal", quantity=165000.0, rate_per_mt=14.35, change_dod=-0.05, status="FIXED"),
        FreightRate(date=datetime.datetime(2025, 2, 4), route="Newcastle -> Paradip", vessel_type="Capesize", cargo="Thermal Coal", quantity=150000.0, rate_per_mt=13.90, change_dod=0.15, status="FIXED"),
        FreightRate(date=datetime.datetime(2025, 1, 30), route="Hay Point -> Paradip", vessel_type="Capesize", cargo="Coking Coal", quantity=165000.0, rate_per_mt=13.60, change_dod=0.25, status="BENCHMARK"),

        # USA -> Paradip / Vizag (Capesize)
        FreightRate(date=datetime.datetime(2025, 2, 14), route="Norfolk -> Paradip", vessel_type="Capesize", cargo="Coking Coal", quantity=160000.0, rate_per_mt=31.50, change_dod=0.40, status="SPOT"),
        FreightRate(date=datetime.datetime(2025, 2, 10), route="Norfolk -> Paradip", vessel_type="Capesize", cargo="Coking Coal", quantity=160000.0, rate_per_mt=31.10, change_dod=0.25, status="FIXED"),

        # Mozambique -> Vizag / Paradip (Panamax / Capesize)
        FreightRate(date=datetime.datetime(2025, 2, 14), route="Richards Bay -> Paradip", vessel_type="Capesize", cargo="Thermal Coal", quantity=150000.0, rate_per_mt=12.20, change_dod=0.10, status="SPOT"),
        FreightRate(date=datetime.datetime(2025, 2, 12), route="Maputo -> Visakhapatnam", vessel_type="Panamax", cargo="Coking Coal", quantity=75000.0, rate_per_mt=15.40, change_dod=0.15, status="FIXED"),

        # Indonesia -> Paradip / Haldia (Panamax / Supramax)
        FreightRate(date=datetime.datetime(2025, 2, 14), route="Samarinda -> Paradip", vessel_type="Panamax", cargo="Thermal Coal", quantity=75000.0, rate_per_mt=8.80, change_dod=0.05, status="SPOT"),
        FreightRate(date=datetime.datetime(2025, 2, 10), route="Samarinda -> Haldia", vessel_type="Handysize", cargo="Thermal Coal", quantity=38000.0, rate_per_mt=12.10, change_dod=0.10, status="FIXED"),

        # Russia -> East Coast India
        FreightRate(date=datetime.datetime(2025, 2, 14), route="Vanino -> Paradip", vessel_type="Capesize", cargo="Coking Coal", quantity=150000.0, rate_per_mt=22.40, change_dod=0.30, status="SPOT"),
    ]
    db.add_all(freight_rates)

    # Historical Voyages for Ledger
    voyages = [
        # Upcoming
        Voyage(voyage_id="VYG-2025-084", cargo="Coking Coal", route="Hay Point → Paradip", vessel="MV Maritime Fortune", quantity=165000.0, cost_per_mt=14.85, status="UPCOMING", date_str="18–25 Feb 2025", eta_str="08 Mar 2025", progress_pct=0.0),
        Voyage(voyage_id="VYG-2025-083", cargo="Iron Ore", route="Port Hedland → Dhamra", vessel="MV Ocean Pioneer", quantity=180000.0, cost_per_mt=10.20, status="UPCOMING", date_str="24–28 Feb 2025", eta_str="12 Mar 2025", progress_pct=0.0),
        Voyage(voyage_id="VYG-2025-082", cargo="Thermal Coal", route="Newcastle → Paradip", vessel="MV Pacific Bulk", quantity=165000.0, cost_per_mt=15.10, status="UPCOMING", date_str="02–06 Mar 2025", eta_str="18 Mar 2025", progress_pct=0.0),
        Voyage(voyage_id="VYG-2025-085", cargo="Coking Coal", route="Gladstone → Paradip", vessel="MV Pacific Prosper", quantity=170000.0, cost_per_mt=14.65, status="UPCOMING", date_str="08–14 Mar 2025", eta_str="24 Mar 2025", progress_pct=0.0),

        # Active
        Voyage(voyage_id="VYG-2025-081", cargo="Coking Coal", route="Gladstone → Paradip", vessel="MV Pacific Prosper", quantity=170000.0, cost_per_mt=14.60, status="ACTIVE", date_str="12 Feb 2025", eta_str="16 Feb", progress_pct=88.0),
        Voyage(voyage_id="VYG-2025-080", cargo="Iron Ore", route="Port Hedland → Dhamra", vessel="MV Iron Leader", quantity=185000.0, cost_per_mt=10.15, status="ACTIVE", date_str="11 Feb 2025", eta_str="19 Feb", progress_pct=62.0),
        Voyage(voyage_id="VYG-2025-079", cargo="Coking Coal", route="Hay Point → Paradip", vessel="MV Golden Voyager", quantity=165000.0, cost_per_mt=14.55, status="ACTIVE", date_str="10 Feb 2025", eta_str="22 Feb", progress_pct=34.0),
        Voyage(voyage_id="VYG-2025-078", cargo="Thermal Coal", route="Gladstone → Visakhapatnam", vessel="MV Southern Cross", quantity=75000.0, cost_per_mt=14.15, status="ACTIVE", date_str="08 Feb 2025", eta_str="20 Feb", progress_pct=50.0),
        Voyage(voyage_id="VYG-2025-074", cargo="Coking Coal", route="Hay Point → Gangavaram", vessel="MV Capesize Apex", quantity=165000.0, cost_per_mt=14.75, status="ACTIVE", date_str="06 Feb 2025", eta_str="18 Feb", progress_pct=75.0),
        Voyage(voyage_id="VYG-2025-073", cargo="Iron Ore", route="Port Hedland → Paradip", vessel="MV Indian Bulk", quantity=165000.0, cost_per_mt=10.40, status="ACTIVE", date_str="05 Feb 2025", eta_str="17 Feb", progress_pct=82.0),

        # Completed
        Voyage(voyage_id="VYG-2025-077", cargo="Coking Coal", route="Hay Point → Paradip", vessel="MV Capesize Apex", quantity=165000.0, cost_per_mt=14.35, status="COMPLETED", date_str="07 Feb 2025", eta_str="14 Feb 2025", progress_pct=100.0),
        Voyage(voyage_id="VYG-2025-076", cargo="Thermal Coal", route="Newcastle → Paradip", vessel="MV East Bulk", quantity=150000.0, cost_per_mt=13.90, status="COMPLETED", date_str="04 Feb 2025", eta_str="11 Feb 2025", progress_pct=100.0),
        Voyage(voyage_id="VYG-2025-075", cargo="Coking Coal", route="Hay Point → Paradip", vessel="MV Indian Bulk", quantity=165000.0, cost_per_mt=13.60, status="COMPLETED", date_str="30 Jan 2025", eta_str="07 Feb 2025", progress_pct=100.0),
        Voyage(voyage_id="VYG-2025-072", cargo="Iron Ore", route="Port Hedland -> Dhamra", vessel="MV Iron Leader", quantity=185000.0, cost_per_mt=9.95, status="COMPLETED", date_str="25 Jan 2025", eta_str="02 Feb 2025", progress_pct=100.0),
        Voyage(voyage_id="VYG-2025-071", cargo="Coking Coal", route="Gladstone -> Paradip", vessel="MV Maritime Fortune", quantity=165000.0, cost_per_mt=14.10, status="COMPLETED", date_str="20 Jan 2025", eta_str="28 Jan 2025", progress_pct=100.0),
        Voyage(voyage_id="VYG-2025-070", cargo="Thermal Coal", route="Newcastle -> Haldia", vessel="MV Southern Cross", quantity=42000.0, cost_per_mt=18.50, status="COMPLETED", date_str="15 Jan 2025", eta_str="24 Jan 2025", progress_pct=100.0),
        Voyage(voyage_id="VYG-2025-069", cargo="Coking Coal", route="Hay Point -> Visakhapatnam", vessel="MV Ocean Pioneer", quantity=175000.0, cost_per_mt=14.25, status="COMPLETED", date_str="10 Jan 2025", eta_str="18 Jan 2025", progress_pct=100.0),
    ]
    db.add_all(voyages)

    # Initial User Settings
    settings = UserSettings(
        full_name="Capt. J. Vance",
        role_title="Chief Charterer & Head of Procurement",
        email_route="j.vance@sailfreight.intl",
        reporting_currency="USD ($) — Standard Maritime",
        spot_rate_alerts=True,
        port_congestion_alerts=True,
        vessel_availability_alerts=True,
        fixture_approvals_alerts=True,
        daily_digest_alerts=False,
        sms_urgent_dispatch=False,
        default_starting_screen="Dashboard",
        display_density="High Density (Terminal)",
        table_pagination_count=10
    )
    db.add(settings)

    db.commit()
    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    init_db()
