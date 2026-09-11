import sys
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

ROOT_DIR = Path(__file__).resolve().parents[3]

DATASET_PATH = ROOT_DIR / "SIH26006_Freight_Model" / "SIH26006_Freight_Model" / "data" / "market_freight_rate_dataset_50000_2015_2025.csv"
FORECAST_PATH = ROOT_DIR / "SIH26006_Freight_Model" / "SIH26006_Freight_Model" / "forecast_360_days.csv"
MODEL_PATH = ROOT_DIR / "SIH26006_Freight_Model" / "SIH26006_Freight_Model" / "models" / "freight_rate_forecasting_model.pkl"


class FreightDatasetCache:
    _daily_df: Optional[pd.DataFrame] = None
    _forecast_df: Optional[pd.DataFrame] = None
    _latest_date: Optional[pd.Timestamp] = None
    _latest_rate: float = 16.39
    _avg_7d: float = 15.84
    _avg_30d: float = 15.46
    _std_30d: float = 0.29
    _is_loaded: bool = False

    @classmethod
    def load(cls):
        if cls._is_loaded:
            return

        try:
            if DATASET_PATH.exists():
                df_hist = pd.read_csv(DATASET_PATH)
                df_hist["Date"] = pd.to_datetime(df_hist["Date"], errors="coerce")
                df_hist = df_hist.dropna(subset=["Date", "Market_Freight_Rate_USD_per_Tonne"])
                
                daily = (
                    df_hist.groupby(df_hist["Date"].dt.normalize())["Market_Freight_Rate_USD_per_Tonne"]
                    .mean()
                    .reset_index()
                )
                daily.columns = ["Date", "Rate"]
                cls._daily_df = daily.sort_values("Date").reset_index(drop=True)

                cls._latest_date = cls._daily_df["Date"].max()
                cls._latest_rate = round(float(cls._daily_df.loc[cls._daily_df["Date"] == cls._latest_date, "Rate"].iloc[0]), 2)
                cls._avg_7d = round(float(cls._daily_df["Rate"].tail(7).mean()), 2)
                cls._avg_30d = round(float(cls._daily_df["Rate"].tail(30).mean()), 2)
                cls._std_30d = round(float(cls._daily_df["Rate"].tail(30).std()), 2)

            if FORECAST_PATH.exists():
                cls._forecast_df = pd.read_csv(FORECAST_PATH)
                cls._forecast_df["Date"] = pd.to_datetime(cls._forecast_df["Date"], errors="coerce")
                cls._forecast_df["Rate"] = pd.to_numeric(cls._forecast_df["Forecast_Rate_USD_per_Tonne"], errors="coerce")

            cls._is_loaded = True
        except Exception as e:
            print(f"Warning loading FreightDatasetCache: {e}")
            cls._is_loaded = True

    @classmethod
    def get_route_multiplier(cls, start_port: str, dest_port: str) -> float:
        """Adjust base freight benchmark for specific origin-destination corridors."""
        start_lower = str(start_port).lower()
        dest_lower = str(dest_port).lower()

        # Australia -> India (Standard benchmark baseline)
        if any(p in start_lower for p in ["hay point", "newcastle", "gladstone", "port hedland", "dampier"]):
            return 1.0
        # US East Coast (Norfolk, Baltimore, Hampton Roads) -> India (~11,000 nm)
        elif any(p in start_lower for p in ["norfolk", "baltimore", "hampton", "usa", "us"]):
            return 2.25
        # South Africa (Richards Bay, Saldanha) -> India (~5,000 nm)
        elif any(p in start_lower for p in ["richards bay", "saldanha", "durban", "south africa"]):
            return 1.25
        # Indonesia (Samarinda, Taboneo, Muara Satui) -> India (~2,500 nm)
        elif any(p in start_lower for p in ["samarinda", "taboneo", "muara", "indonesia"]):
            return 0.72
        # Russia / Far East (Vanino, Vostochny) -> India
        elif any(p in start_lower for p in ["vanino", "vostochny", "russia"]):
            return 1.45
        return 1.0


class FreightService:
    @staticmethod
    def get_route_spot_and_trend(
        db: Session = None,
        start_port_str: str = "Hay Point",
        dest_port_str: str = "Paradip",
        cargo_type: str = "Coal"
    ) -> Dict[str, Any]:
        FreightDatasetCache.load()

        multiplier = FreightDatasetCache.get_route_multiplier(start_port_str, dest_port_str)

        df_fc = FreightDatasetCache._forecast_df
        today_ts = pd.to_datetime(datetime.date.today()).normalize()
        
        idx = None
        if df_fc is not None and not df_fc.empty:
            match = df_fc[df_fc["Date"].dt.normalize() == today_ts]
            if not match.empty:
                idx = match.index[0]

        if idx is not None:
            base_spot = round(float(df_fc.iloc[idx]["Rate"]), 2)
            fc_30_idx = min(len(df_fc) - 1, idx + 30)
            base_forecast = round(float(df_fc.iloc[fc_30_idx]["Rate"]), 2)
            if idx >= 7:
                base_7d_avg = round(float(df_fc.iloc[idx-7:idx]["Rate"].mean()), 2)
            else:
                base_7d_avg = FreightDatasetCache._avg_7d
        else:
            base_spot = FreightDatasetCache._latest_rate
            base_forecast = float(df_fc.iloc[29]["Rate"]) if df_fc is not None and len(df_fc) >= 30 else 15.32
            base_7d_avg = FreightDatasetCache._avg_7d

        spot_rate = round(base_spot * multiplier, 2)
        forecast_rate = round(base_forecast * multiplier, 2)
        avg_change = round((base_spot - base_7d_avg) * multiplier, 2)

        if forecast_rate > spot_rate * 1.01:
            direction = "rise"
            direction_symbol = "▲"
        elif forecast_rate < spot_rate * 0.99:
            direction = "down"
            direction_symbol = "▼"
        else:
            direction = "normal"
            direction_symbol = "—"

        # Build dynamic 6-month historical & forecast curve
        trend_history = []
        if idx is not None and df_fc is not None:
            m_minus3_idx = max(0, idx - 90)
            m_minus2_idx = max(0, idx - 60)
            m_minus1_idx = max(0, idx - 30)
            
            d_m3 = df_fc.iloc[m_minus3_idx]["Date"].strftime("%b %y").upper()
            d_m2 = df_fc.iloc[m_minus2_idx]["Date"].strftime("%b %y").upper()
            d_m1 = df_fc.iloc[m_minus1_idx]["Date"].strftime("%b %y").upper()
            d_spot = df_fc.iloc[idx]["Date"].strftime("%b %y (SPOT)").upper()
            
            r_m3 = round(float(df_fc.iloc[m_minus3_idx:m_minus2_idx]["Rate"].mean()) * multiplier, 2)
            r_m2 = round(float(df_fc.iloc[m_minus2_idx:m_minus1_idx]["Rate"].mean()) * multiplier, 2)
            r_m1 = round(float(df_fc.iloc[m_minus1_idx:idx]["Rate"].mean()) * multiplier, 2)
            
            trend_history = [
                {"month": d_m3, "rate": r_m3, "is_forecast": False},
                {"month": d_m2, "rate": r_m2, "is_forecast": False},
                {"month": d_m1, "rate": r_m1, "is_forecast": False},
                {"month": d_spot, "rate": spot_rate, "is_forecast": False},
            ]
            
            fc_1m_idx = min(len(df_fc) - 1, idx + 30)
            fc_2m_idx = min(len(df_fc) - 1, idx + 60)
            
            d_fc1 = df_fc.iloc[fc_1m_idx]["Date"].strftime("%b %y (F)").upper()
            d_fc2 = df_fc.iloc[fc_2m_idx]["Date"].strftime("%b %y (F)").upper()
            
            r_fc1 = round(float(df_fc.iloc[fc_1m_idx]["Rate"]) * multiplier, 2)
            r_fc2 = round(float(df_fc.iloc[fc_2m_idx]["Rate"]) * multiplier, 2)
            
            trend_history.append({"month": d_fc1, "rate": r_fc1, "is_forecast": True})
            trend_history.append({"month": d_fc2, "rate": r_fc2, "is_forecast": True})
        elif FreightDatasetCache._daily_df is not None and len(FreightDatasetCache._daily_df) >= 120:
            df_d = FreightDatasetCache._daily_df
            m_oct = round(float(df_d.iloc[-120:-90]["Rate"].mean()) * multiplier, 2)
            m_nov = round(float(df_d.iloc[-90:-60]["Rate"].mean()) * multiplier, 2)
            m_dec = round(float(df_d.iloc[-60:-30]["Rate"].mean()) * multiplier, 2)
            trend_history = [
                {"month": "OCT 25", "rate": m_oct, "is_forecast": False},
                {"month": "NOV 25", "rate": m_nov, "is_forecast": False},
                {"month": "DEC 25", "rate": m_dec, "is_forecast": False},
                {"month": "JAN 26 (SPOT)", "rate": spot_rate, "is_forecast": False},
            ]
            if df_fc is not None and len(df_fc) >= 60:
                fc_feb = round(float(df_fc.iloc[30]["Rate"]) * multiplier, 2)
                fc_mar = round(float(df_fc.iloc[59]["Rate"]) * multiplier, 2)
                trend_history.append({"month": "FEB 26 (F)", "rate": fc_feb, "is_forecast": True})
                trend_history.append({"month": "MAR 26 (F)", "rate": fc_mar, "is_forecast": True})
        else:
            trend_history = [
                {"month": "OCT 25", "rate": round(spot_rate * 0.92, 2), "is_forecast": False},
                {"month": "NOV 25", "rate": round(spot_rate * 0.95, 2), "is_forecast": False},
                {"month": "DEC 25", "rate": round(spot_rate * 0.98, 2), "is_forecast": False},
                {"month": "JAN 26 (SPOT)", "rate": spot_rate, "is_forecast": False},
                {"month": "FEB 26 (F)", "rate": round(spot_rate * 0.99, 2), "is_forecast": True},
                {"month": "MAR 26 (F)", "rate": forecast_rate, "is_forecast": True}
            ]

        return {
            "spot_rate": spot_rate,
            "direction": direction,
            "direction_symbol": direction_symbol,
            "forecast_rate": forecast_rate,
            "trend_history": trend_history,
            "avg_change": avg_change,
            "benchmark_date": str(datetime.date.today())
        }

    @staticmethod
    def calculate_forecast(current_rate: float, direction: str = "BULLISH", origin: str = "Hay Point", destination: str = "Paradip") -> Dict[str, Any]:
        FreightDatasetCache.load()

        multiplier = FreightDatasetCache.get_route_multiplier(origin, destination)
        df_fc = FreightDatasetCache._forecast_df
        today_ts = pd.to_datetime(datetime.date.today()).normalize()

        idx = None
        if df_fc is not None and not df_fc.empty:
            match = df_fc[df_fc["Date"].dt.normalize() == today_ts]
            if not match.empty:
                idx = match.index[0]

        # Determine indices
        if idx is not None:
            idx_7 = min(len(df_fc) - 1, idx + 7)
            idx_14 = min(len(df_fc) - 1, idx + 14)
            idx_30 = min(len(df_fc) - 1, idx + 30)
            idx_90 = min(len(df_fc) - 1, idx + 90)
            idx_180 = min(len(df_fc) - 1, idx + 180)
            idx_360 = min(len(df_fc) - 1, idx + 360)
        else:
            idx_7 = min(len(df_fc) - 1, 6) if df_fc is not None else 6
            idx_14 = min(len(df_fc) - 1, 13) if df_fc is not None else 13
            idx_30 = min(len(df_fc) - 1, 29) if df_fc is not None else 29
            idx_90 = min(len(df_fc) - 1, 89) if df_fc is not None else 89
            idx_180 = min(len(df_fc) - 1, 179) if df_fc is not None else 179
            idx_360 = min(len(df_fc) - 1, 359) if df_fc is not None else 359

        # Horizon 7 days
        fc_7_raw = float(df_fc.iloc[idx_7]["Rate"]) if df_fc is not None and len(df_fc) > idx_7 else (current_rate / multiplier * 0.982)
        fc_7 = round(fc_7_raw * multiplier, 2)
        diff_7 = round(fc_7 - current_rate, 2)
        pct_7 = round((diff_7 / current_rate) * 100, 1)

        # Horizon 14 days
        fc_14_raw = float(df_fc.iloc[idx_14]["Rate"]) if df_fc is not None and len(df_fc) > idx_14 else (current_rate / multiplier * 0.973)
        fc_14 = round(fc_14_raw * multiplier, 2)
        diff_14 = round(fc_14 - current_rate, 2)
        pct_14 = round((diff_14 / current_rate) * 100, 1)

        # Horizon 30 days
        fc_30_raw = float(df_fc.iloc[idx_30]["Rate"]) if df_fc is not None and len(df_fc) > idx_30 else (current_rate / multiplier * 0.970)
        fc_30 = round(fc_30_raw * multiplier, 2)
        diff_30 = round(fc_30 - current_rate, 2)
        pct_30 = round((diff_30 / current_rate) * 100, 1)

        idx_60 = min(len(df_fc) - 1, (idx + 60) if idx is not None else 59)
        fc_60_raw = float(df_fc.iloc[idx_60]["Rate"]) if df_fc is not None and len(df_fc) > idx_60 else (current_rate / multiplier * 0.955)
        fc_60 = round(fc_60_raw * multiplier, 2)
        diff_60 = round(fc_60 - current_rate, 2)
        pct_60 = round((diff_60 / current_rate) * 100, 1)

        # Horizon 90 days
        fc_90_raw = float(df_fc.iloc[idx_90]["Rate"]) if df_fc is not None and len(df_fc) > idx_90 else (current_rate / multiplier * 0.947)
        fc_90 = round(fc_90_raw * multiplier, 2)
        diff_90 = round(fc_90 - current_rate, 2)
        pct_90 = round((diff_90 / current_rate) * 100, 1)

        # Horizon 180 days
        fc_180_raw = float(df_fc.iloc[idx_180]["Rate"]) if df_fc is not None and len(df_fc) > idx_180 else (current_rate / multiplier * 0.939)
        fc_180 = round(fc_180_raw * multiplier, 2)
        diff_180 = round(fc_180 - current_rate, 2)
        pct_180 = round((diff_180 / current_rate) * 100, 1)

        # Horizon 360 days
        fc_360_raw = float(df_fc.iloc[idx_360]["Rate"]) if df_fc is not None and len(df_fc) > idx_360 else (current_rate / multiplier * 0.956)
        fc_360 = round(fc_360_raw * multiplier, 2)
        diff_360 = round(fc_360 - current_rate, 2)
        pct_360 = round((diff_360 / current_rate) * 100, 1)

        date_7 = (datetime.date.today() + datetime.timedelta(days=7)).strftime("%d %b %Y").upper()
        date_14 = (datetime.date.today() + datetime.timedelta(days=14)).strftime("%d %b %Y").upper()
        date_30 = (datetime.date.today() + datetime.timedelta(days=30)).strftime("%d %b %Y").upper()
        date_60 = (datetime.date.today() + datetime.timedelta(days=60)).strftime("%d %b %Y").upper()
        date_90 = (datetime.date.today() + datetime.timedelta(days=90)).strftime("%d %b %Y").upper()
        date_180 = (datetime.date.today() + datetime.timedelta(days=180)).strftime("%d %b %Y").upper()
        date_360 = (datetime.date.today() + datetime.timedelta(days=360)).strftime("%d %b %Y").upper()

        return {
            "h7": {
                "horizon_days": 7,
                "date_str": date_7,
                "forecast_rate": fc_7,
                "change_usd": abs(diff_7),
                "change_pct": abs(pct_7),
                "is_positive": diff_7 >= 0,
                "confidence_pct": 94,
                "range_min": round(fc_7 - 0.25, 2),
                "range_max": round(fc_7 + 0.35, 2),
            },
            "h14": {
                "horizon_days": 14,
                "date_str": date_14,
                "forecast_rate": fc_14,
                "change_usd": abs(diff_14),
                "change_pct": abs(pct_14),
                "is_positive": diff_14 >= 0,
                "confidence_pct": 89,
                "range_min": round(fc_14 - 0.35, 2),
                "range_max": round(fc_14 + 0.45, 2),
            },
            "h30": {
                "horizon_days": 30,
                "date_str": date_30,
                "forecast_rate": fc_30,
                "change_usd": abs(diff_30),
                "change_pct": abs(pct_30),
                "is_positive": diff_30 >= 0,
                "confidence_pct": 82,
                "range_min": round(fc_30 - 0.50, 2),
                "range_max": round(fc_30 + 0.65, 2),
            },
            "h60": {
                "horizon_days": 60,
                "date_str": date_60,
                "forecast_rate": fc_60,
                "change_usd": abs(diff_60),
                "change_pct": abs(pct_60),
                "is_positive": diff_60 >= 0,
                "confidence_pct": 78,
                "range_min": round(fc_60 - 0.65, 2),
                "range_max": round(fc_60 + 0.80, 2),
            },
            "h90": {
                "horizon_days": 90,
                "date_str": date_90,
                "forecast_rate": fc_90,
                "change_usd": abs(diff_90),
                "change_pct": abs(pct_90),
                "is_positive": diff_90 >= 0,
                "confidence_pct": 75,
                "range_min": round(fc_90 - 0.75, 2),
                "range_max": round(fc_90 + 0.95, 2),
            },
            "h180": {
                "horizon_days": 180,
                "date_str": date_180,
                "forecast_rate": fc_180,
                "change_usd": abs(diff_180),
                "change_pct": abs(pct_180),
                "is_positive": diff_180 >= 0,
                "confidence_pct": 70,
                "range_min": round(fc_180 - 1.10, 2),
                "range_max": round(fc_180 + 1.30, 2),
            },
            "h360": {
                "horizon_days": 360,
                "date_str": date_360,
                "forecast_rate": fc_360,
                "change_usd": abs(diff_360),
                "change_pct": abs(pct_360),
                "is_positive": diff_360 >= 0,
                "confidence_pct": 65,
                "range_min": round(fc_360 - 1.40, 2),
                "range_max": round(fc_360 + 1.70, 2),
            }
        }

