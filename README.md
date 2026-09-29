# Guardian Agent 2.0 🛡️
### AI Agent Security, Risk Prediction & Governance Platform

Guardian Agent 2.0 is a comprehensive runtime security gateway for autonomous AI agents. It intercepts every proposed tool/API action before execution, enforces deterministic security policies, detects sensitive information (PII/secrets), predicts risk using a trained multiclass ML model, flags anomalous behavioral spikes with an unsupervised anomaly detector (Isolation Forest), performs contextual LLM security reasoning, and arbitrates final decisions (`ALLOW`, `APPROVAL_REQUIRED`, `BLOCK`).

---

## 🏗️ Architecture & Signal Hierarchy

```
AI Agent → Tool Request → Guardian Gateway → Policy Engine + PII/Secret Scan + ML Risk Prediction + Anomaly Detection + LLM Context → Decision Arbiter → ALLOW / APPROVAL_REQUIRED / BLOCK → Tool / Human Approval → Audit + Dashboard
```

1. **Hard Security Policy (Highest Authority)**: Deterministic rules (e.g. prohibited destructive queries, secret leakage). Can force immediate `BLOCK`.
2. **Tool Permission & Destination Allow-List**: Strict whitelist of authorized tools and endpoints.
3. **Deterministic PII & Secret Scanner**: Regex & pattern detector that redacts payloads and enforces security gates.
4. **Supervised ML Risk Classifier**: Multiclass classification predicting probabilities across `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
5. **Unsupervised Anomaly Detector**: Isolation Forest flagging abnormal volume, destination, or call frequency deviations.
6. **LLM Contextual Reasoning**: Non-authoritative intent & prompt injection explainability.
7. **Human Approval Workflow**: Token-controlled queue for escalated actions.

---

## 📊 Completed Implementation Summary

### Track A — Full-Stack / Product Foundation (Phases 0–6)
- **Phase 0 — Planning & Architecture**: Threat model, database schema, API contracts, and architecture specs in [`docs/`](file:///c:/Users/omraj/OneDrive/Desktop/guardian_agent/docs).
- **Phase 1 — Authentication, RBAC & Database**: JWT auth with bcrypt, RBAC (`Admin`, `Developer`, `Security Reviewer`, `Approver`), Mongoose schemas, and automated in-memory MongoDB fallback.
- **Phase 2 — Agent & Tool Registry**: API key generation (SHA-256 hashed), 3 safe mock tools (`weather_api`, `email_sender`, `customer_db`), and cryptographic direct bypass prevention.
- **Phase 3 — Guardian Gateway & Interception**: `/api/guardian/evaluate` and `/api/guardian/execute` with single-use execution tokens.
- **Phase 4 — Policy Engine**: Priority-ordered deterministic rules with hard-deny enforcement.
- **Phase 5 — PII & Secret Detection & Audit**: Deterministic scanner with recursive payload redactor and tamper-resistant audit logs.
- **Phase 6 — Full-Stack Dashboard & Realtime**: Next.js 14 dashboard with dark cyber aesthetics, Socket.IO live stream, KPI telemetry, and trace modals.

### Track B — Standalone ML Development (Phases 7–12)
- **Phase 7 — Feature Contract & Labels**: Schema for 9 action features and 4 risk levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Phase 8 — Dataset Generation**: 5,200 labeled scenarios across train (70%), validation (15%), and untouched test (15%) sets.
- **Phase 9 — Supervised Model Training**: Logistic Regression (98.7%), Random Forest (99.7%), and XGBoost (99.7%) compared. Best model serialized to `best_model.joblib`.
- **Phase 10 — Test Evaluation & Packaging**: 100.00% accuracy and 1.000 F1 on untouched test set with **13.44ms** P50 inference latency.
- **Phase 11 — ML Inference Service**: FastAPI service serving `POST /api/ml/predict` and `GET /health` on port 8000.
- **Phase 12 — Anomaly Detection**: Isolation Forest model trained on baseline behavior profiles and served via `POST /api/ml/anomaly`.

### Track C — Integration & Advanced Security (Phases 13–20)
- **Phase 13 — Node.js ↔ ML Integration**: Backend HTTP clients for ML risk prediction and anomaly detection with timeouts and graceful fallback.
- **Phase 14 — Decision Fusion**: Multi-signal arbitration preserving hard policy authority over ML predictions.
- **Phase 15 — LLM Contextual Security Analysis**: Semantic prompt injection analyzer and reviewer explanation engine.
- **Phase 16 — Human Approval Workflow**: Cryptographic one-time approval tokens, expiration, and authorized execution gate.
- **Phase 17 — Attack Simulator & Security Testing**: 100% pass rate (8 / 8) on attack scenarios (prompt injection, PII exfiltration, credential leakage, bulk scraping, destructive SQL).
- **Phase 18 — Final Dashboard Integration**: Full telemetry binding across Overview, Approvals, Policies, Agents, Audit, Simulator, and ML Governance.
- **Phase 19 — Evaluation & Hardening**: Hardening report in [`docs/HARDENING_REPORT.md`](file:///c:/Users/omraj/OneDrive/Desktop/guardian_agent/docs/HARDENING_REPORT.md).
- **Phase 20 — Production Deployment**: Dockerfiles, `docker-compose.yml`, and deployment guide in [`docs/DEPLOYMENT.md`](file:///c:/Users/omraj/OneDrive/Desktop/guardian_agent/docs/DEPLOYMENT.md).

---

## 🚀 Quick Start Commands

```bash
# 1. Run Backend Unit & Security Test Suite (11/11 tests pass)
cd backend
npm test

# 2. Run Attack Simulator Test Suite (8/8 scenarios pass)
npm run test:simulator

# 3. Run Untouched Test Set ML Evaluation
cd ../ml
python src/evaluate.py

# 4. Launch Full Stack with Docker
cd ..
docker-compose up -d --build
```
