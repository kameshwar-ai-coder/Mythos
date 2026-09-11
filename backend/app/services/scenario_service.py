class ScenarioService:
    @staticmethod
    def get_scenarios(base_cost: float = 21.30):
        # DOWN (15%): $20.40 / MT
        # BASE (70%): $21.30 / MT
        # UP (15%): $22.95 / MT
        return {
            "scenarios": [
                {"name": "DOWN (15%)", "probability_pct": 15, "cost_per_mt": round(base_cost - 0.90, 2)},
                {"name": "BASE (70%)", "probability_pct": 70, "cost_per_mt": base_cost},
                {"name": "UP (15%)", "probability_pct": 15, "cost_per_mt": round(base_cost + 1.65, 2)}
            ]
        }
