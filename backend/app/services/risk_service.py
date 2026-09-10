class RiskService:
    @staticmethod
    def evaluate_risks(waiting_days: float = 1.8, rightship_score: float = 5.0, market_direction: str = "BULLISH", port_feasible: bool = True):
        # 1. Market Risk (1 - 10)
        market_score = 3.2 if market_direction == "BULLISH" else (4.5 if market_direction == "STABLE" else 2.1)
        market_label = "[MODERATE]" if market_score >= 3.0 else "[LOW]"

        # 2. Port Risk (1 - 10)
        port_score = round(min(9.5, 1.5 + (waiting_days * 0.8) + (0 if port_feasible else 6.0)), 1)
        port_label = "[HIGH]" if port_score >= 6.0 else ("[LOW-MED]" if port_score >= 2.5 else "[LOW]")

        # 3. Vessel Risk (1 - 10)
        vessel_score = round(max(1.0, (5.0 - rightship_score) * 2.0 + 1.1), 1)
        vessel_label = "[VERY LOW]" if vessel_score < 2.0 else ("[MODERATE]" if vessel_score < 5.0 else "[HIGH]")

        # 4. Operational Risk (1 - 10)
        operational_score = 2.0
        operational_label = "[LOW]"

        # Overall weighted risk
        overall_score = round((market_score * 0.3) + (port_score * 0.3) + (vessel_score * 0.2) + (operational_score * 0.2), 1)
        overall_label = "[CRITICAL]" if overall_score >= 6.5 else ("[ELEVATED]" if overall_score >= 4.5 else "[CONTROLLED]")

        return {
            "overall_score": overall_score,
            "overall_label": overall_label,
            "details": [
                {"category": "MARKET RISK", "score": market_score, "max_score": 10.0, "label": market_label},
                {"category": "PORT RISK", "score": port_score, "max_score": 10.0, "label": port_label},
                {"category": "VESSEL RISK", "score": vessel_score, "max_score": 10.0, "label": vessel_label},
                {"category": "OPERATIONAL RISK", "score": operational_score, "max_score": 10.0, "label": operational_label},
            ]
        }
