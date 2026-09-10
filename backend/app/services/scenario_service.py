class ScenarioService:
    @staticmethod
    def get_scenarios(base_cost: float = 21.30):
        # Matching screen1.png:
        # BEARISH (15%): $20.40 / MT
        # BASE (70%): $21.30 / MT
        # BULLISH (15%): $22.95 / MT
        return {
            "scenarios": [
                {"name": "BEARISH (15%)", "probability_pct": 15, "cost_per_mt": round(base_cost - 0.90, 2)},
                {"name": "BASE (70%)", "probability_pct": 70, "cost_per_mt": base_cost},
                {"name": "BULLISH (15%)", "probability_pct": 15, "cost_per_mt": round(base_cost + 1.65, 2)}
            ]
        }
