from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.pricing_service import pricing_service
from services.fraud_service import fraud_service

app = FastAPI(title="KaryaKavach ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PricingRequest(BaseModel):
    zone_id: str
    tier: str = "standard"

class FraudRequest(BaseModel):
    amount: float = 0.0
    frequency: int = 0
    location_pattern: str = "normal"
    timing_pattern: str = "normal"

class CurfewRequest(BaseModel):
    text: str
    zone_id: str = ""

@app.get("/")
async def root():
    return {"message": "KaryaKavach ML Service is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/pricing/quote")
async def pricing_quote(request: PricingRequest):
    """Get ML-adjusted pricing quote"""
    result = pricing_service.predict_premium(request.zone_id, request.tier)
    return result

@app.post("/fraud/predict")
async def fraud_predict(request: FraudRequest):
    """Predict fraud probability for a claim"""
    claim_data = {
        "amount": request.amount,
        "frequency": request.frequency,
        "location_pattern": request.location_pattern,
        "timing_pattern": request.timing_pattern
    }
    result = fraud_service.predict_fraud(claim_data)
    return result

@app.post("/curfew/classify")
async def curfew_classify(request: CurfewRequest):
    """Classify if text is curfew-related"""
    # Mock implementation - in real scenario would use NLP model
    text_lower = request.text.lower()
    curfew_keywords = ["curfew", "lockdown", "restriction", "ban", "prohibited"]
    
    is_curfew = any(keyword in text_lower for keyword in curfew_keywords)
    confidence = 0.9 if is_curfew else 0.1
    
    return {
        "is_curfew_related": is_curfew,
        "confidence": confidence,
        "keywords_found": [kw for kw in curfew_keywords if kw in text_lower]
    }
