"""
Dataset Generator for Guardian Agent 2.0 (Phase 7 & Phase 8)
Generates 5,000+ labeled security-action scenarios across LOW, MEDIUM, HIGH, CRITICAL.
"""

import json
import os
import random
import numpy as np
import pandas as pd

np.random.seed(42)
random.seed(42)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

ACTIONS = ['read', 'write', 'delete', 'send', 'export', 'execute']
CATEGORIES = ['READ', 'WRITE', 'DELETE', 'EXECUTE', 'EXPORT', 'COMMUNICATION']
SENSITIVITIES = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']
DATA_TYPES = ['public', 'internal', 'PII', 'credential/secret']
DESTINATION_TYPES = ['trusted_internal', 'allow_listed', 'unknown_external']
AGENT_ROLES = ['support_agent', 'dev_ops', 'security_auditor', 'sales_bot', 'analytics_worker']

def generate_record(target_label):
    if target_label == 'LOW':
        action = random.choice(['read', 'send'])
        category = 'READ' if action == 'read' else 'COMMUNICATION'
        sensitivity = random.choice(['PUBLIC', 'INTERNAL'])
        data_type = 'public' if sensitivity == 'PUBLIC' else 'internal'
        destination_type = random.choice(['trusted_internal', 'allow_listed'])
        volume = int(np.random.exponential(scale=15)) + 1
        volume = min(volume, 45) # Keep strictly under threshold
        agent_role = random.choice(AGENT_ROLES)
        hour = random.randint(8, 18) # Normal business hours
        failed_actions = 0

    elif target_label == 'MEDIUM':
        action = random.choice(['write', 'export', 'send'])
        category = 'WRITE' if action == 'write' else ('EXPORT' if action == 'export' else 'COMMUNICATION')
        sensitivity = random.choice(['INTERNAL', 'CONFIDENTIAL'])
        data_type = random.choice(['internal', 'PII'])
        destination_type = random.choice(['trusted_internal', 'allow_listed'])
        volume = random.randint(40, 200)
        agent_role = random.choice(AGENT_ROLES)
        hour = random.randint(7, 21)
        failed_actions = random.choice([0, 1])

    elif target_label == 'HIGH':
        action = random.choice(['export', 'write', 'send', 'execute'])
        category = 'EXPORT' if action == 'export' else ('WRITE' if action == 'write' else 'COMMUNICATION')
        sensitivity = random.choice(['CONFIDENTIAL', 'RESTRICTED'])
        data_type = random.choice(['PII', 'internal'])
        destination_type = random.choice(['allow_listed', 'unknown_external'])
        volume = random.randint(250, 15000)
        agent_role = random.choice(['support_agent', 'sales_bot'])
        hour = random.choice([22, 23, 0, 1, 2, 3, 4]) # Off-hours
        failed_actions = random.randint(1, 4)

    else: # CRITICAL
        action = random.choice(['delete', 'execute', 'export'])
        category = 'DELETE' if action == 'delete' else ('EXECUTE' if action == 'execute' else 'EXPORT')
        sensitivity = random.choice(['CONFIDENTIAL', 'RESTRICTED'])
        data_type = random.choice(['credential/secret', 'PII'])
        destination_type = 'unknown_external' if random.random() > 0.4 else 'trusted_internal'
        volume = random.randint(1000, 100000)
        agent_role = random.choice(AGENT_ROLES)
        hour = random.randint(0, 23)
        failed_actions = random.randint(2, 8)

    return {
        'action': action,
        'toolCategory': category,
        'toolSensitivity': sensitivity,
        'dataType': data_type,
        'destinationType': destination_type,
        'volume': int(volume),
        'agentRole': agent_role,
        'hourOfDay': int(hour),
        'recentFailedActions': int(failed_actions),
        'riskLabel': target_label,
    }

def create_dataset():
    print("Generating 5,200 structured security-action scenarios...")
    records = []
    
    # Target counts matching PRD Section 7
    counts = {
        'LOW': 1600,
        'MEDIUM': 1300,
        'HIGH': 1300,
        'CRITICAL': 1000,
    }

    for label, count in counts.items():
        for _ in range(count):
            records.append(generate_record(label))

    random.shuffle(records)
    df = pd.DataFrame(records)

    # 70% Train, 15% Validation, 15% Untouched Test
    n = len(df)
    train_end = int(0.70 * n)
    val_end = int(0.85 * n)

    train_df = df.iloc[:train_end]
    val_df = df.iloc[train_end:val_end]
    test_df = df.iloc[val_end:]

    train_path = os.path.join(DATA_DIR, 'train.csv')
    val_path = os.path.join(DATA_DIR, 'val.csv')
    test_path = os.path.join(DATA_DIR, 'test.csv')

    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)

    metadata = {
        'totalRecords': len(df),
        'classCounts': {k: int(v) for k, v in df['riskLabel'].value_counts().items()},
        'splits': {
            'train': len(train_df),
            'val': len(val_df),
            'test': len(test_df),
        },
        'featureColumns': [c for c in df.columns if c != 'riskLabel'],
        'labelClasses': ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        'version': 'v1.0.0',
    }

    meta_path = os.path.join(DATA_DIR, 'dataset_metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"Dataset generated successfully! Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")
    print(f"Saved to {DATA_DIR}")
    return metadata

if __name__ == '__main__':
    create_dataset()
