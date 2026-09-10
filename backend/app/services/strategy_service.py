class StrategyService:
    @staticmethod
    def get_charter_strategies(spot_rate: float = 14.85):
        # Matching screen1.png:
        # SPOT: $14.85 / MT [RECOMMENDED]
        # MULTIPLE VOYAGE: $15.20 / MT [ALTERNATIVE]
        # MEDIUM TERM: $24,500 / DAY [NOT ADVISED]
        return {
            "options": [
                {
                    "name": "SPOT",
                    "rate_str": f"${spot_rate:.2f} / MT",
                    "status_tag": "[RECOMMENDED]",
                    "is_recommended": True
                },
                {
                    "name": "MULTIPLE VOYAGE",
                    "rate_str": f"${spot_rate + 0.35:.2f} / MT",
                    "status_tag": "[ALTERNATIVE]",
                    "is_recommended": False
                },
                {
                    "name": "MEDIUM TERM",
                    "rate_str": "$24,500 / DAY",
                    "status_tag": "[NOT ADVISED]",
                    "is_recommended": False
                }
            ]
        }
