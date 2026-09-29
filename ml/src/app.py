"""
FastAPI ML Inference Service for Guardian Agent 2.0 (Phase 11)
Serves supervised risk prediction and unsupervised anomaly detection.
"""

import os
import time
import joblib
import pandas as pd
from typing import Optional, List, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from preprocess import LABEL_MAP, INV_LABEL_MAP, CATEGORICAL_FEATURES, NUMERICAL_FEATURES
from anomaly import predict_anomaly

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')

app = FastAPI(
    title="Guardian Agent 2.0 ML Inference Service",
    version="2.0.0",
    description="High-performance risk prediction & behavioral anomaly API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
preprocessor = None
risk_model = None
anomaly_model = None
model_version = "guardian-ml-v1.0.0"

def load_models():
    global preprocessor, risk_model, anomaly_model, model_version
    prep_path = os.path.join(MODEL_DIR, 'preprocessor.joblib')
    model_path = os.path.join(MODEL_DIR, 'best_model.joblib')
    anom_path = os.path.join(MODEL_DIR, 'anomaly_isolation_forest.joblib')

    if os.path.exists(prep_path) and os.path.exists(model_path):
        preprocessor = joblib.load(prep_path)
        risk_model = joblib.load(model_path)
        print("[ML Service] Loaded risk classification model and preprocessor.")

    if os.path.exists(anom_path):
        anomaly_model = joblib.load(anom_path)
        print("[ML Service] Loaded Isolation Forest anomaly model.")

@app.on_event("startup")
async def startup_event():
    load_models()

class ActionRiskRequest(BaseModel):
    action: str = Field(..., example="export")
    toolCategory: str = Field(..., example="EXPORT")
    toolSensitivity: str = Field(..., example="CONFIDENTIAL")
    dataType: str = Field(..., example="PII")
    destinationType: str = Field(..., example="unknown_external")
    volume: int = Field(default=1, example=5000)
    agentRole: str = Field(default="support_agent", example="support_agent")
    hourOfDay: int = Field(default=12, example=22)
    recentFailedActions: int = Field(default=0, example=3)

class ActionRiskResponse(BaseModel):
    modelVersion: str
    predictedRisk: str
    probabilities: Dict[str, float]
    latencyMs: float

class AnomalyRequest(BaseModel):
    agentId: str = Field(..., example="agent-support-01")
    requestsLastHour: Optional[float] = 120.0
    volumeRequested: Optional[float] = 50.0
    isNewDestination: Optional[bool] = False
    failedRatioLastHour: Optional[float] = 0.0

class AnomalyResponse(BaseModel):
    isAnomaly: bool
    anomalyScore: float
    deviationFactors: List[str]

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "Guardian Agent 2.0 ML Service",
        "riskModelLoaded": risk_model is not None,
        "anomalyModelLoaded": anomaly_model is not None,
        "version": model_version,
    }

@app.post("/api/ml/predict", response_model=ActionRiskResponse)
def predict_risk(payload: ActionRiskRequest):
    global risk_model, preprocessor
    if risk_model is None or preprocessor is None:
        load_models()
        if risk_model is None:
            raise HTTPException(status_code=503, detail="Risk model not trained or loaded.")

    t0 = time.perf_counter()
    row = pd.DataFrame([{
        'action': payload.action,
        'toolCategory': payload.toolCategory,
        'toolSensitivity': payload.toolSensitivity,
        'dataType': payload.dataType,
        'destinationType': payload.destinationType,
        'volume': payload.volume,
        'agentRole': payload.agentRole,
        'hourOfDay': payload.hourOfDay,
        'recentFailedActions': payload.recentFailedActions,
    }])

    feat = preprocessor.transform(row)
    probs = risk_model.predict_proba(feat)[0]
    pred_idx = int(risk_model.predict(feat)[0])
    predicted_label = INV_LABEL_MAP.get(pred_idx, 'MEDIUM')
    latency_ms = (time.perf_counter() - t0) * 1000

    prob_dict = {
        'LOW': round(float(probs[0]), 4),
        'MEDIUM': round(float(probs[1]), 4),
        'HIGH': round(float(probs[2]), 4),
        'CRITICAL': round(float(probs[3]), 4),
    }

    return ActionRiskResponse(
        modelVersion=model_version,
        predictedRisk=predicted_label,
        probabilities=prob_dict,
        latencyMs=round(latency_ms, 2),
    )

@app.post("/api/ml/anomaly", response_model=AnomalyResponse)
def evaluate_anomaly(payload: AnomalyRequest):
    global anomaly_model
    if anomaly_model is None:
        load_models()
        if anomaly_model is None:
            raise HTTPException(status_code=503, detail="Anomaly model not trained or loaded.")

    result = predict_anomaly(anomaly_model, payload.dict())
    return AnomalyResponse(**result)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
