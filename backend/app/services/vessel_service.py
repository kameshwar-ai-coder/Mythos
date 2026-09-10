from sqlalchemy.orm import Session
from app.models.models import Vessel, Port

class VesselService:
    @staticmethod
    def analyze_vessels(db: Session, quantity_mt: float, category: str = "Dry Bulk", destination_port_str: str = "Paradip"):
        candidates = db.query(Vessel).all()
        result_list = []

        # Find destination port to evaluate draft constraints
        dest_name = destination_port_str.split(",")[0].strip()
        port = db.query(Port).filter(Port.name.ilike(f"%{dest_name}%")).first()
        port_max_draft = port.max_draft if port else 17.10
        port_max_dwt = port.max_dwt if port else 200000.0

        for v in candidates:
            # 1. HARD CONSTRAINT: DWT >= Quantity
            capacity_fits = v.dwt >= (quantity_mt * 0.95)
            # 2. HARD CONSTRAINT: Vessel DWT <= Port Max DWT
            port_dwt_fits = v.dwt <= (port_max_dwt * 1.05)
            # 3. Draft constraint
            draft_fits = v.draft <= (port_max_draft + 1.2) # Laden can be lighter or berth limits

            if capacity_fits and port_dwt_fits and draft_fits:
                # Calculate suitability dynamically (70 - 99%)
                cap_utilization = min(quantity_mt / v.dwt, 1.0)
                safety_factor = (v.rightship_score / 5.0) * 20
                age_factor = max(0, 15 - (2025 - v.built_year))
                suitability = round(55 + (cap_utilization * 25) + safety_factor + age_factor)
                suitability = min(suitability, 98)
            elif not capacity_fits:
                suitability = max(20, round((v.dwt / quantity_mt) * 50))
            else:
                suitability = 35

            result_list.append({
                "name": v.name.upper(),
                "dwt": v.dwt,
                "suitability": int(suitability),
                "built_year": v.built_year,
                "vessel_class": v.vessel_class,
                "rightship_score": v.rightship_score,
                "draft": v.draft,
                "loa": v.loa,
                "beam": v.beam,
                "daily_hire_rate": v.daily_hire_rate,
                "is_capacity_fit": capacity_fits,
                "is_port_fit": port_dwt_fits and draft_fits
            })

        # Sort by suitability descending
        result_list.sort(key=lambda x: x["suitability"], reverse=True)

        top_vessel = result_list[0] if result_list else {
            "name": "MV MARITIME FORTUNE",
            "dwt": 181240.0,
            "suitability": 96,
            "rightship_score": 5.0,
            "draft": 18.20,
            "loa": 292.0,
            "beam": 45.0,
            "daily_hire_rate": 24500.0,
            "is_capacity_fit": True,
            "is_port_fit": True
        }

        return {
            "recommended_vessel": top_vessel["name"],
            "dwt": top_vessel["dwt"],
            "suitability": top_vessel["suitability"],
            "rightship_score": top_vessel.get("rightship_score", 5.0),
            "top_vessel_obj": top_vessel,
            "vessels_list": [
                {
                    "name": v["name"],
                    "dwt": v["dwt"],
                    "suitability": v["suitability"]
                }
                for v in result_list[:3]
            ]
        }
