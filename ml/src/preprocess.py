"""
Preprocessing and Feature Engineering for Guardian Agent 2.0 (Phase 7 & 8)
Encodes categorical features and scales numerical values.
"""

import os
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

CATEGORICAL_FEATURES = [
    'action',
    'toolCategory',
    'toolSensitivity',
    'dataType',
    'destinationType',
    'agentRole',
]

NUMERICAL_FEATURES = [
    'volume',
    'hourOfDay',
    'recentFailedActions',
]

LABEL_MAP = {
    'LOW': 0,
    'MEDIUM': 1,
    'HIGH': 2,
    'CRITICAL': 3,
}

INV_LABEL_MAP = {v: k for k, v in LABEL_MAP.items()}

def build_preprocessor():
    categorical_transformer = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
    numerical_transformer = StandardScaler()

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', categorical_transformer, CATEGORICAL_FEATURES),
            ('num', numerical_transformer, NUMERICAL_FEATURES),
        ]
    )
    return preprocessor

def fit_and_save_preprocessor(train_df):
    X = train_df[CATEGORICAL_FEATURES + NUMERICAL_FEATURES]
    preprocessor = build_preprocessor()
    preprocessor.fit(X)
    
    preprocessor_path = os.path.join(MODEL_DIR, 'preprocessor.joblib')
    joblib.dump(preprocessor, preprocessor_path)
    print(f"[Preprocess] Saved fitted feature pipeline to {preprocessor_path}")
    return preprocessor

def load_preprocessor():
    preprocessor_path = os.path.join(MODEL_DIR, 'preprocessor.joblib')
    if not os.path.exists(preprocessor_path):
        raise FileNotFoundError(f"Preprocessor not found at {preprocessor_path}. Train the pipeline first.")
    return joblib.load(preprocessor_path)

if __name__ == '__main__':
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'train.csv')
    if os.path.exists(data_path):
        df = pd.read_csv(data_path)
        fit_and_save_preprocessor(df)
    else:
        print(f"File {data_path} not found. Run dataset_generator.py first.")
