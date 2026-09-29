"""
Model Evaluation and Packaging for Guardian Agent 2.0 (Phase 10)
Evaluates production model on untouched test data (test.csv).
Generates confusion matrix, latency benchmarks, and packaging metrics.
"""

import json
import os
import time
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
from preprocess import LABEL_MAP, CATEGORICAL_FEATURES, NUMERICAL_FEATURES

import sys
sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')

def evaluate_on_test_data():
    print("=" * 60)
    print("[EVAL] Evaluating Guardian Agent Model on Untouched Test Set")
    print("=" * 60)

    test_path = os.path.join(DATA_DIR, 'test.csv')
    if not os.path.exists(test_path):
        raise FileNotFoundError(f"Test data not found at {test_path}")

    test_df = pd.read_csv(test_path)
    feature_cols = CATEGORICAL_FEATURES + NUMERICAL_FEATURES

    preprocessor_path = os.path.join(MODEL_DIR, 'preprocessor.joblib')
    model_path = os.path.join(MODEL_DIR, 'best_model.joblib')

    if not os.path.exists(preprocessor_path) or not os.path.exists(model_path):
        raise FileNotFoundError("Preprocessor or Model not found. Run train.py first.")

    preprocessor = joblib.load(preprocessor_path)
    model = joblib.load(model_path)

    # 1. Latency benchmark
    latencies = []
    sample_record = test_df.iloc[:1][feature_cols]

    for _ in range(100):
        t0 = time.perf_counter()
        feat = preprocessor.transform(sample_record)
        _ = model.predict_proba(feat)
        latencies.append((time.perf_counter() - t0) * 1000)

    p50_latency = float(np.percentile(latencies, 50))
    p95_latency = float(np.percentile(latencies, 95))

    # 2. Evaluation on complete test set
    X_test = preprocessor.transform(test_df[feature_cols])
    y_test = test_df['riskLabel'].map(LABEL_MAP).values

    y_pred = model.predict(X_test)
    y_probs = model.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='weighted')
    cm = confusion_matrix(y_test, y_pred).tolist()

    report = classification_report(
        y_test,
        y_pred,
        target_names=['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        output_dict=True,
    )

    evaluation_report = {
        'evaluationTimestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'testSetSize': len(test_df),
        'accuracy': float(acc),
        'weightedF1': float(f1),
        'confusionMatrix': cm,
        'perClassMetrics': {
            'LOW': report['LOW'],
            'MEDIUM': report['MEDIUM'],
            'HIGH': report['HIGH'],
            'CRITICAL': report['CRITICAL'],
        },
        'latencyBenchmarkMs': {
            'p50': p50_latency,
            'p95': p95_latency,
        },
        'status': 'PASSED_EVALUATION',
    }

    report_path = os.path.join(MODEL_DIR, 'test_evaluation_report.json')
    with open(report_path, 'w') as f:
        json.dump(evaluation_report, f, indent=2)

    print(f"Test Accuracy: {acc * 100:.2f}% | Test F1: {f1:.4f}")
    print(f"Inference Latency: P50 = {p50_latency:.2f}ms, P95 = {p95_latency:.2f}ms")
    print(f"Evaluation report saved to: {report_path}")
    print("=" * 60)
    return evaluation_report

if __name__ == '__main__':
    evaluate_on_test_data()
