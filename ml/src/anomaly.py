"""
Behavioral Anomaly Detection for Guardian Agent 2.0 (Phase 12)
Trains and evaluates an unsupervised Isolation Forest model to detect
deviations from normal AI agent operational baselines.
"""

import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

import sys
sys.stdout.reconfigure(encoding='utf-8')

# Baseline feature vector: [requestsLastHour, volumeRequested, isNewDestination (0/1), failedRatioLastHour]
FEATURE_NAMES = ['requestsLastHour', 'volumeRequested', 'isNewDestination', 'failedRatioLastHour']

def generate_normal_baseline_data(n_samples=2000):
    np.random.seed(42)
    # Normal agent behavior: 100-300 calls/hr, <100 records/req, known destination (0), low failure rate (<0.05)
    requests = np.random.normal(loc=180, scale=35, size=n_samples).clip(50, 320)
    volumes = np.random.exponential(scale=20, size=n_samples).clip(1, 80)
    new_dest = np.zeros(n_samples) # 99% normal destinations
    failed_ratios = np.random.beta(a=1, b=50, size=n_samples) # close to 0

    df = pd.DataFrame({
        'requestsLastHour': requests,
        'volumeRequested': volumes,
        'isNewDestination': new_dest,
        'failedRatioLastHour': failed_ratios,
    })
    return df

def train_anomaly_model():
    print("[ANOMALY] Training Isolation Forest Anomaly Detection Model...")
    df = generate_normal_baseline_data(2500)

    # Train Isolation Forest with 5% expected contamination
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42,
    )
    iso_forest.fit(df[FEATURE_NAMES])

    model_path = os.path.join(MODEL_DIR, 'anomaly_isolation_forest.joblib')
    joblib.dump(iso_forest, model_path)
    print(f"[ANOMALY] Saved anomaly model to {model_path}")
    return iso_forest

def predict_anomaly(model, agent_data):
    """
    Inference helper: returns isAnomaly (bool), anomalyScore (float 0..1), and explanation
    """
    row = pd.DataFrame([{
        'requestsLastHour': float(agent_data.get('requestsLastHour', 100)),
        'volumeRequested': float(agent_data.get('volumeRequested', 10)),
        'isNewDestination': 1.0 if agent_data.get('isNewDestination') else 0.0,
        'failedRatioLastHour': float(agent_data.get('failedRatioLastHour', 0.0)),
    }])

    # raw score: lower means more abnormal
    raw_score = model.score_samples(row)[0]
    # Normalize score so higher = more anomalous (0 to 1)
    normalized_score = float(np.clip(-raw_score, 0.0, 1.0))
    is_anomaly = bool(model.predict(row)[0] == -1 or normalized_score > 0.65)

    deviations = []
    if row['volumeRequested'].iloc[0] > 500:
        deviations.append(f"Volume {int(row['volumeRequested'].iloc[0])}x exceeds baseline threshold (<100)")
    if row['requestsLastHour'].iloc[0] > 400:
        deviations.append(f"Call frequency {int(row['requestsLastHour'].iloc[0])}/hr exceeds normal (<300)")
    if row['isNewDestination'].iloc[0] > 0.5:
        deviations.append("Communication directed to previously unseen external destination")
    if row['failedRatioLastHour'].iloc[0] > 0.2:
        deviations.append(f"Failed request ratio ({row['failedRatioLastHour'].iloc[0]*100:.1f}%) is elevated")

    return {
        'isAnomaly': is_anomaly,
        'anomalyScore': round(normalized_score, 4),
        'deviationFactors': deviations if deviations else ['Normal baseline distribution'],
    }

if __name__ == '__main__':
    train_anomaly_model()
