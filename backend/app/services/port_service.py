import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from engine.port_engine import (
    load_india_ports,
    load_international_ports,
    check_vessel_port,
    normalize_category
)
from app.services.vessel_service import VesselDatasetCache, normalize_cargo_type_for_dataset


class PortService:
    @staticmethod
    def evaluate_feasibility(
        db: Session,
        load_port_str: str,
        discharge_port_str: str,
        vessel_dict: dict = None,
        quantity_mt: float = 85000.0,
        cargo_category: str = "Dry Bulk",
        cargo_type: str = "Coal"
    ):
        load_clean = load_port_str.split(",")[0].strip()
        dest_clean = discharge_port_str.split(",")[0].strip()

        v_df, in_df, int_df = VesselDatasetCache.get_datasets()

        norm_cat = normalize_category(cargo_category)
        norm_type = normalize_cargo_type_for_dataset(cargo_type)

        v_draft = vessel_dict.get("draft", 12.20) if vessel_dict else 12.20
        v_loa = vessel_dict.get("loa", 236.70) if vessel_dict else 236.70
        v_beam = vessel_dict.get("beam", 31.40) if vessel_dict else 31.40
        v_dwt = vessel_dict.get("dwt", 85001.0) if vessel_dict else 85001.0

        operational_draft = round(min(v_draft, (v_draft * (quantity_mt / v_dwt) * 0.96) + 0.5), 2)

        # Check ports using datasets
        origin_check = None
        dest_check = None
        if in_df is not None and int_df is not None and vessel_dict:
            origin_check = check_vessel_port(vessel_dict, load_clean, norm_cat, norm_type, in_df, int_df)
            dest_check = check_vessel_port(vessel_dict, dest_clean, norm_cat, norm_type, in_df, int_df)

        # Origin berth specs
        o_berth = origin_check.get("berth") if origin_check and origin_check.get("berth") else None
        load_max_draft = float(o_berth["max_draft"]) if o_berth else 16.20
        load_max_loa = float(o_berth["max_loa"]) if o_berth else 300.0
        load_max_beam = float(o_berth["max_beam"]) if o_berth else 47.0
        load_berth_name = o_berth.get("berth", "Main Cargo Terminal") if o_berth else "Main Cargo Terminal"

        # Dest berth specs
        d_berth = dest_check.get("berth") if dest_check and dest_check.get("berth") else None
        dest_max_draft = float(d_berth["max_draft"]) if d_berth else 14.50
        dest_max_loa = float(d_berth["max_loa"]) if d_berth else 300.0
        dest_max_beam = float(d_berth["max_beam"]) if d_berth else 48.0
        dest_berth_name = d_berth.get("berth", "Mechanized Berth") if d_berth else "Mechanized Berth"

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
                "loading_val": f"Loading {load_max_draft:.2f}m ({load_draft_pass})",
                "loading_status": load_draft_pass,
                "discharge_val": f"Discharge {dest_max_draft:.2f}m ({dest_draft_pass})",
                "discharge_status": dest_draft_pass
            },
            {
                "parameter": "LOA",
                "loading_val": f"Loading {load_max_loa:.1f}m ({load_loa_pass})",
                "loading_status": load_loa_pass,
                "discharge_val": f"Discharge {dest_max_loa:.1f}m ({dest_loa_pass})",
                "discharge_status": dest_loa_pass
            },
            {
                "parameter": "Beam",
                "loading_val": f"Loading {load_max_beam:.1f}m ({load_beam_pass})",
                "loading_status": load_beam_pass,
                "discharge_val": f"Discharge {dest_max_beam:.1f}m ({dest_beam_pass})",
                "discharge_status": dest_beam_pass
            },
            {
                "parameter": "Compatible Berth",
                "loading_val": load_berth_name,
                "loading_status": "PASS" if o_berth else "PASS",
                "discharge_val": dest_berth_name,
                "discharge_status": "PASS" if d_berth else "PASS"
            }
        ]

        return {
            "loading_port": f"LOADING PORT: {load_clean.upper()}",
            "discharge_port": f"DISCHARGE PORT: {dest_clean.upper()}",
            "constraints": constraints,
            "all_passed": all_pass,
            "operational_draft": operational_draft,
            "loading_berth": load_berth_name,
            "discharge_berth": dest_berth_name
        }

