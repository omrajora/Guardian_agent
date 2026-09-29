"""
Supervised Model Training Pipeline for Guardian Agent 2.0 (Phase 9)
Trains Logistic Regression, Random Forest, and XGBoost/GradientBoosting models.
Compares validation metrics and selects best production model.
"""

import json
import os
import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, accuracy_score, f1_score

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from preprocess import fit_and_save_preprocessor, LABEL_MAP, CATEGORICAL_FEATURES, NUMERICAL_FEATURES

import sys
sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

def train_and_compare_models():
    print("=" * 60)
    print("[TRAIN] Starting Guardian Agent 2.0 ML Training Pipeline")
    print("=" * 60)

    train_path = os.path.join(DATA_DIR, 'train.csv')
    val_path = os.path.join(DATA_DIR, 'val.csv')

    if not os.path.exists(train_path) or not os.path.exists(val_path):
        raise FileNotFoundError("Train or Val CSV not found. Run dataset_generator.py first.")

    train_df = pd.read_csv(train_path)
    val_df = pd.read_csv(val_path)

    print(f"Loaded {len(train_df)} training samples and {len(val_df)} validation samples.")

    # 1. Fit & Save Preprocessing Pipeline
    preprocessor = fit_and_save_preprocessor(train_df)

    feature_cols = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
    X_train = preprocessor.transform(train_df[feature_cols])
    y_train = train_df['riskLabel'].map(LABEL_MAP).values

    X_val = preprocessor.transform(val_df[feature_cols])
    y_val = val_df['riskLabel'].map(LABEL_MAP).values

    models = {
        'LogisticRegression': LogisticRegression(max_iter=1000, random_state=42),
        'RandomForest': RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42),
    }

    if HAS_XGBOOST:
        models['XGBoost'] = XGBClassifier(
            n_estimators=120,
            learning_rate=0.1,
            max_depth=6,
            random_state=42,
            eval_metric='mlogloss',
        )
    else:
        models['GradientBoosting'] = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42,
        )

    results = {}
    best_f1 = -1
    best_model_name = None
    best_model = None

    for name, clf in models.items():
        print(f"\n[Training] {name}...")
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_val)

        acc = accuracy_score(y_val, y_pred)
        f1 = f1_score(y_val, y_pred, average='weighted')
        report = classification_report(
            y_val,
            y_pred,
            target_names=['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            output_dict=True,
        )

        results[name] = {
            'accuracy': float(acc),
            'f1_score': float(f1),
            'classification_report': report,
        }

        print(f"  → Validation Accuracy: {acc * 100:.2f}% | Weighted F1: {f1:.4f}")

        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_model = clf

    # Save comparison report
    comparison_path = os.path.join(MODEL_DIR, 'model_comparison.json')
    with open(comparison_path, 'w') as f:
        json.dump(results, f, indent=2)

    # Save Best Model
    best_model_path = os.path.join(MODEL_DIR, 'best_model.joblib')
    joblib.dump(best_model, best_model_path)

    metadata = {
        'modelName': f'guardian-risk-{best_model_name.lower()}',
        'version': 'v1.0.0',
        'algorithm': best_model_name,
        'datasetVersion': 'v1.0.0',
        'validationAccuracy': results[best_model_name]['accuracy'],
        'validationF1': results[best_model_name]['f1_score'],
        'classes': ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    }

    meta_path = os.path.join(MODEL_DIR, 'model_metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print("\n" + "=" * 60)
    print(f"[BEST MODEL] Selected: {best_model_name} (F1: {best_f1:.4f})")
    print(f"[SAVED] Saved best model to: {best_model_path}")
    print(f"[REPORT] Saved comparison report to: {comparison_path}")
    print("=" * 60)
    return metadata

if __name__ == '__main__':
    train_and_compare_models()
