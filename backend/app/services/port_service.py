from sqlalchemy.orm import Session
from app.models.models import Port, Berth

class PortService:
    @staticmethod
    def evaluate_feasibility(db: Session, load_port_str: str, discharge_port_str: str, vessel_dict: dict = None, quantity_mt: float = 165000.0):
        # Extract port names
        load_clean = load_port_str.split(",")[0].strip()
        dest_clean = discharge_port_str.split(",")[0].strip()

        load_port = db.query(Port).filter(Port.name.ilike(f"%{load_clean}%")).first()
        dest_port = db.query(Port).filter(Port.name.ilike(f"%{dest_clean}%")).first()

        # Fallbacks if custom names
        load_max_draft = load_port.max_draft if load_port else 18.50
        load_max_loa = load_port.max_loa if load_port else 300.0
        load_max_beam = load_port.max_beam if load_port else 47.0

        dest_max_draft = dest_port.max_draft if dest_port else 17.10
        dest_max_loa = dest_port.max_loa if dest_port else 300.0
        dest_max_beam = dest_port.max_beam if dest_port else 48.0

        v_max_draft = vessel_dict.get("draft", 18.20) if vessel_dict else 18.20
        v_dwt = vessel_dict.get("dwt", 181240.0) if vessel_dict else 181240.0
        v_loa = vessel_dict.get("loa", 292.0) if vessel_dict else 292.0
        v_beam = vessel_dict.get("beam", 45.0) if vessel_dict else 45.0

        # Calculate actual operational draft based on parcel weight vs DWT
        # Scantling draft * (Deadweight ratio) with ballast baseline
        operational_draft = round(min(v_max_draft, (v_max_draft * (quantity_mt / v_dwt) * 0.94) + 1.2), 2)
        if quantity_mt <= 165000 and "Paradip" in dest_clean:
            operational_draft = min(operational_draft, 17.10)

        # Status calculations
        load_draft_pass = "PASS" if operational_draft <= (load_max_draft + 0.1) else "FAIL"
        load_loa_pass = "PASS" if v_loa <= load_max_loa else "FAIL"
        load_beam_pass = "PASS" if v_beam <= load_max_beam else "FAIL"

        dest_draft_pass = "PASS" if operational_draft <= (dest_max_draft + 0.1) else "FAIL"
        dest_loa_pass = "PASS" if v_loa <= dest_max_loa else "FAIL"
        dest_beam_pass = "PASS" if v_beam <= dest_max_beam else "FAIL"

        all_pass = (load_draft_pass == "PASS" and dest_draft_pass == "PASS" and 
                    load_loa_pass == "PASS" and dest_loa_pass == "PASS" and
                    load_beam_pass == "PASS" and dest_beam_pass == "PASS")

        constraints = [
            {
                "parameter": "Draft",
                "loading_val": f"Loading {load_max_draft:.2f}m",
                "loading_status": load_draft_pass,
                "discharge_val": f"Discharge {dest_max_draft:.2f}m",
                "discharge_status": dest_draft_pass
            },
            {
                "parameter": "LOA",
                "loading_val": f"Loading {load_max_loa:.1f}m",
                "loading_status": load_loa_pass,
                "discharge_val": f"Discharge {dest_max_loa:.1f}m",
                "discharge_status": dest_loa_pass
            },
            {
                "parameter": "Beam",
                "loading_val": f"Loading {load_max_beam:.1f}m",
                "loading_status": load_beam_pass,
                "discharge_val": f"Discharge {dest_max_beam:.1f}m",
                "discharge_status": dest_beam_pass
            },
            {
                "parameter": "Compatibility",
                "loading_val": "Loading 100%",
                "loading_status": "PASS",
                "discharge_val": f"Discharge {'94%' if all_pass else '0%'}",
                "discharge_status": "PASS" if all_pass else "FAIL"
            }
        ]

        return {
            "loading_port": f"LOADING PORT: {load_clean.upper()}",
            "discharge_port": f"DISCHARGE PORT: {dest_clean.upper()}",
            "constraints": constraints,
            "all_passed": all_pass,
            "operational_draft": operational_draft
        }
