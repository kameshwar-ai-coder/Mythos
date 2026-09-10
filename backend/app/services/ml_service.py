from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import pandas as pd


class VesselModelService:
    """Loads the checked-in vessel classifier once and provides safe predictions."""

    _pipeline: Any = None
    _encoder: Any = None
    _load_attempted = False

    @classmethod
    def predict_vessel_class(
        cls,
        cargo_category: str,
        cargo_type: str,
        min_dwt: float,
        max_dwt: float,
        draft: float,
        loa: float,
        beam: float,
    ) -> Optional[Dict[str, Any]]:
        root = Path(__file__).resolve().parents[3]
        if not cls._load_attempted:
            cls._load_attempted = True
            try:
                cls._pipeline = joblib.load(root / "models" / "vessel_recommendation_model.pkl")
                cls._encoder = joblib.load(root / "models" / "vessel_label_encoder.pkl")
            except (FileNotFoundError, ImportError, ModuleNotFoundError, ValueError):
                cls._pipeline = None
                cls._encoder = None

        if cls._pipeline is None or cls._encoder is None:
            return None

        features = pd.DataFrame([{
            "cargo_category": cargo_category,
            "cargo_type": cargo_type,
            "min_dwt": min_dwt,
            "max_dwt": max_dwt,
            "draft": draft,
            "loa": loa,
            "beam": beam,
        }])
        encoded = cls._pipeline.predict(features)[0]
        vessel_class = str(cls._encoder.inverse_transform([int(encoded)])[0])
        confidence = None
        if hasattr(cls._pipeline, "predict_proba"):
            confidence = round(float(max(cls._pipeline.predict_proba(features)[0])) * 100, 1)
        dataset_path = root / "data" / "cargo_vessel_dataset_50000.csv"
        matching_row = None
        if dataset_path.exists():
            dataset = pd.read_csv(dataset_path)
            cargo_name = cargo_type.split("(")[0].strip().lower()
            dataset_cargo_name = {
                "coking coal": "coal",
                "thermal coal": "coal",
            }.get(cargo_name, cargo_name)
            rows = dataset[
                (dataset["cargo_category"].str.lower() == cargo_category.lower())
                & (dataset["cargo_type"].str.lower() == dataset_cargo_name)
                & (dataset["vessel_type"].str.lower() == vessel_class.lower())
            ]
            if not rows.empty:
                target_dwt = min_dwt / 0.95
                size_fit = rows[(rows["min_dwt"] <= target_dwt) & (rows["max_dwt"] >= target_dwt)]
                matching_row = (size_fit if not size_fit.empty else rows).iloc[0]

        dataset_vessel_class = str(matching_row["vessel_type"]) if matching_row is not None else vessel_class
        return {
            "vessel_class": dataset_vessel_class,
            "confidence": confidence,
            "dataset_source": "data/cargo_vessel_dataset_50000.csv" if matching_row is not None else None,
            "dataset_row": int(matching_row.name) + 2 if matching_row is not None else None,
            "dwt": float(matching_row["max_dwt"]) if matching_row is not None else max_dwt,
            "dwt_min": float(matching_row["min_dwt"]) if matching_row is not None else min_dwt,
            "dwt_max": float(matching_row["max_dwt"]) if matching_row is not None else max_dwt,
            "draft": float(matching_row["draft"]) if matching_row is not None else draft,
            "loa": float(matching_row["loa"]) if matching_row is not None else loa,
            "beam": float(matching_row["beam"]) if matching_row is not None else beam,
        }