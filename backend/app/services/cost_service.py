from sqlalchemy.orm import Session
from app.models.models import PortCongestion, Port

class CostService:
    @staticmethod
    def calculate_effective_cost(db: Session, freight_rate: float, quantity_mt: float, dest_port_str: str = "Paradip", daily_hire: float = 24500.0):
        dest_clean = dest_port_str.split(",")[0].strip()
        congestion = db.query(PortCongestion).filter(PortCongestion.port_name.ilike(f"%{dest_clean}%")).first()

        waiting_days = congestion.waiting_days if congestion else 1.8
        
        # Calculate waiting cost per MT: (Waiting days * Daily vessel cost) / Quantity MT
        waiting_cost_per_mt = round((waiting_days * daily_hire) / max(quantity_mt, 10000), 2)
        if waiting_cost_per_mt < 0.50:
            waiting_cost_per_mt = 1.40

        # Bunker cost modeling (~19-20% of voyage)
        bunker_per_mt = round(freight_rate * 0.28, 2)
        misc_per_mt = round(freight_rate * 0.06, 2)

        total_cost = round(freight_rate + bunker_per_mt + waiting_cost_per_mt + misc_per_mt, 2)

        freight_pct = round((freight_rate / total_cost) * 100, 1)
        bunker_pct = round((bunker_per_mt / total_cost) * 100, 1)
        waiting_pct = round((waiting_cost_per_mt / total_cost) * 100, 1)
        misc_pct = round((misc_per_mt / total_cost) * 100, 1)

        return {
            "freight": freight_rate,
            "bunker": bunker_per_mt,
            "waiting": waiting_cost_per_mt,
            "misc": misc_per_mt,
            "total_cost_per_mt": total_cost,
            "waiting_days": waiting_days,
            "breakdown": [
                {"name": "FREIGHT", "amount": freight_rate, "percentage": freight_pct},
                {"name": "BUNKER", "amount": bunker_per_mt, "percentage": bunker_pct},
                {"name": "WAITING", "amount": waiting_cost_per_mt, "percentage": waiting_pct},
                {"name": "MISC", "amount": misc_per_mt, "percentage": misc_pct},
            ]
        }
