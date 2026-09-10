from sqlalchemy.orm import Session
from app.models.models import Vessel, Port
from app.services.ml_service import VesselModelService

class VesselService:
    @staticmethod
    def analyze_vessels(db: Session, quantity_mt: float, category: str = "Dry Bulk", cargo_type: str = "Coking Coal (Prime Hard Metallurgical)", destination_port_str: str = "Paradip"):
        candidates = db.query(Vessel).all()
        result_list = []

        # Find destination port to evaluate draft constraints
        dest_name = destination_port_str.split(",")[0].strip()
        port = db.query(Port).filter(Port.name.ilike(f"%{dest_name}%")).first()
        port_max_draft = port.max_draft if port else 17.10
        port_max_dwt = port.max_dwt if port else 200000.0

        model_prediction = VesselModelService.predict_vessel_class(
            cargo_category=category,
            cargo_type=cargo_type,
            min_dwt=quantity_mt * 0.95,
            max_dwt=port_max_dwt,
            draft=port_max_draft,
            loa=port.max_loa if port else 300.0,
            beam=port.max_beam if port else 48.0,
        )
        predicted_class = model_prediction["vessel_class"].lower() if model_prediction else None

        if model_prediction and model_prediction.get("dataset_source"):
            model_vessel = {
                "name": model_prediction["vessel_class"],
                "dwt": model_prediction["dwt"],
                "suitability": int(round(model_prediction["confidence"] or 0)),
                "built_year": None,
                "vessel_class": model_prediction["vessel_class"],
                "rightship_score": None,
                "draft": model_prediction["draft"],
                "loa": model_prediction["loa"],
                "beam": model_prediction["beam"],
                "daily_hire_rate": 24500.0,
                "is_capacity_fit": model_prediction["dwt"] >= quantity_mt * 0.95,
                "is_port_fit": model_prediction["draft"] <= port_max_draft + 1.2,
            }
            return {
                "recommended_vessel": model_vessel["name"],
                "dwt": model_vessel["dwt"],
                "suitability": model_vessel["suitability"],
                "rightship_score": model_vessel["rightship_score"],
                "ml_prediction": model_prediction,
                "top_vessel_obj": model_vessel,
                "vessels_list": [{
                    "name": model_vessel["name"],
                    "dwt": model_vessel["dwt"],
                    "suitability": model_vessel["suitability"],
                    "vessel_class": model_vessel["vessel_class"],
                    "rightship_score": model_vessel["rightship_score"],
                }],
            }

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
                if predicted_class and v.vessel_class.lower() == predicted_class:
                    suitability += 5
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

        if not result_list:
            raise ValueError("No vessel satisfies the cargo and destination port constraints")

        # Prefer a real feasible vessel from the model-predicted class.
        result_list.sort(
            key=lambda vessel: (
                predicted_class is not None and vessel["vessel_class"].lower() == predicted_class,
                vessel["suitability"],
            ),
            reverse=True,
        )
        top_vessel = result_list[0]

        return {
            "recommended_vessel": top_vessel["name"],
            "dwt": top_vessel["dwt"],
            "suitability": top_vessel["suitability"],
            "rightship_score": top_vessel.get("rightship_score", 5.0),
            "ml_prediction": model_prediction,
            "top_vessel_obj": top_vessel,
            "vessels_list": [
                {
                    "name": v["name"],
                    "dwt": v["dwt"],
                    "suitability": v["suitability"],
                    "vessel_class": v["vessel_class"],
                    "rightship_score": v["rightship_score"],
                }
                for v in result_list[:3]
            ]
        }
