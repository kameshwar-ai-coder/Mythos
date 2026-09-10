class DecisionService:
    @staticmethod
    def evaluate_final_decision(
        freight_rate: float,
        landed_cost: float,
        vessel_name: str,
        vessel_suitability: int,
        port_feasible: bool,
        market_direction: str,
        overall_risk_score: float,
        quantity_mt: float,
        waiting_days: float,
        ml_prediction: dict | None = None
    ):
        # 1. HARD CONSTRAINT CHECK
        if not port_feasible or vessel_suitability < 40:
            decision = "REJECT"
            confidence = 95
            strategy = "Incompatible Stem Configuration"
            risk_label = "(CRITICAL RISK)"
            why_market = f"Market direction is {market_direction}, but physical berth/vessel dimensions cannot accommodate stem."
            why_vessel = f"{vessel_name} fails mandatory draft or LOA compatibility for target terminal."
            why_port = "Draft / LOA limit exceeded at discharge berth; berthing would cause grounding."
            why_cost = f"Expected landed cost of ${landed_cost:.2f}/MT cannot be executed due to terminal restrictions."
            why_strategy = "Recommendation: Reject current fixture nomination and downscale parcel or re-route to deepwater terminal."
        
        # 2. MARKET RISING -> BOOK NOW
        elif market_direction == "rise":
            decision = "BOOK NOW"
            confidence = 92
            strategy = "Spot Single Voyage"
            risk_label = "(LOW)" if overall_risk_score < 3.5 else "(MODERATE)"
            why_market = f"Forward curve indicates upward momentum; prompt booking captures current ${freight_rate:.2f}/MT trough before spot escalation."
            model_note = ""
            if ml_prediction:
                model_note = f" ML model classifies the requirement as {ml_prediction['vessel_class']} with {ml_prediction['confidence']:.1f}% confidence."
            why_vessel = f"{vessel_name} provides {vessel_suitability}% model suitability and meets the available corridor constraints.{model_note}"
            why_port = "All draft, LOA, and beam constraints validated PASS with mechanized discharge clearance."
            why_cost = f"Total landed cost ${landed_cost:.2f}/MT is protected against forward freight inflation."
            why_strategy = "Single voyage spot execution mitigates medium-term period commitment while locking prompt fixture."

        # 3. MARKET FALLING -> WAIT
        elif market_direction == "down":
            decision = "WAIT"
            confidence = 86
            strategy = "Prompt Spot Window Delay"
            risk_label = "(LOW)"
            why_market = f"Freight rates trending down (${freight_rate:.2f}/MT falling); delaying fixture window captures softer rates."
            why_vessel = f"{vessel_name} remains in prompt pool; candidate supply is adequate."
            why_port = f"Port queue currently {waiting_days:.1f} days; waiting allows terminal queue normalization."
            why_cost = f"Landed cost ${landed_cost:.2f}/MT expected to decrease by -$0.80 to -$1.20/MT over next 7-10 days."
            why_strategy = "Hold spot booking until laycan T-3 days to capture lowest offer spread."

        # 4. STABLE / UNCERTAIN -> MONITOR
        else:
            decision = "MONITOR"
            confidence = 80
            strategy = "Multi-Offer Tender Tendered"
            risk_label = "(CONTROLLED)"
            why_market = f"Spot freight steady at ${freight_rate:.2f}/MT with balanced Baltic supply-demand index."
            why_vessel = f"{vessel_name} nominated; awaiting competitive counter-offers."
            why_port = "Port feasibility clear; monitoring demurrage exposure."
            why_cost = f"Current landed cost estimate ${landed_cost:.2f}/MT is within ±1.5% of baseline."
            why_strategy = "Keep fixture under continuous monitoring while tendering dual broker quotes."

        decision_data = {
            "decision": decision,
            "vessel": vessel_name,
            "cost_per_mt": freight_rate,
            "landed_cost_per_mt": landed_cost,
            "risk_score": overall_risk_score,
            "risk_label": risk_label,
            "confidence": confidence,
            "strategy": strategy
        }

        why_decision_data = {
            "reasons": [
                {"code": "01", "title": "01 Market", "summary": why_market},
                {"code": "02", "title": "02 Vessel", "summary": why_vessel},
                {"code": "03", "title": "03 Port", "summary": why_port},
                {"code": "04", "title": "04 Cost", "summary": why_cost},
                {"code": "05", "title": "05 Strategy", "summary": why_strategy}
            ]
        }

        return decision_data, why_decision_data
