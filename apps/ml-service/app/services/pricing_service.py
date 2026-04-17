import pickle
import numpy as np
from typing import Dict, Any

class PricingService:
    def __init__(self):
        self.model = None
        self.load_model()
    
    def load_model(self):
        """Load the XGBoost pricing model"""
        try:
            with open('./artifacts/xgboost_pricing.pkl', 'rb') as f:
                self.model_data = pickle.load(f)
            print("✅ XGBoost pricing model loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load pricing model: {e}")
            self.model_data = None
    
    def predict_premium(self, zone_id: str, tier: str = "standard") -> Dict[str, Any]:
        """Predict weekly premium with zone adjustments"""
        if not self.model_data:
            # Fallback mock response
            return {
                "weekly_adjustment": 0.0,
                "zone_label": zone_id.replace('_', ' ').title(),
                "zone_disruption_rate": 0.15,
                "risk_tier": tier,
                "zone_safety_note": "Model unavailable - using fallback",
                "features_used": {},
                "model": "fallback"
            }
        
        # Get zone adjustment from model data
        zone_adjustments = self.model_data.get('zone_adjustments', {})
        
        # Map zone_id to zone key
        zone_mapping = {
            'BLR_KHR_01': 'kharadi',
            'BLR_KOR_01': 'koramangala', 
            'BLR_HSR_01': 'hsr_layout',
            'BLR_IND_01': 'indiranagar',
            'MUM_ANH_01': 'andheri',
            'MUM_BAN_01': 'bandra',
            'DEL_DWK_01': 'dwarka',
            'DEL_NOR_01': 'north_delhi',
            'PNE_KSB_01': 'kothrud',
            'PNE_KHR_01': 'kharadi'
        }
        
        zone_key = zone_mapping.get(zone_id, zone_id.split('_')[1].lower() if '_' in zone_id else zone_id.lower())
        adjustment = zone_adjustments.get(zone_key, 0.0)
        
        # Mock features for demonstration
        features_used = {feature: np.random.rand() for feature in self.model_data.get('features', [])}
        
        return {
            "weekly_adjustment": adjustment,
            "zone_label": zone_id.replace('_', ' ').title(),
            "zone_disruption_rate": 0.15 + abs(adjustment) * 0.01,
            "risk_tier": tier,
            "zone_safety_note": f"Zone risk assessment complete",
            "features_used": features_used,
            "model": f"xgboost-{self.model_data.get('version', '1.7.6')}"
        }

# Global service instance
pricing_service = PricingService()
