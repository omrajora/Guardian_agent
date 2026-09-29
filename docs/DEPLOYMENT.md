# Guardian Agent 2.0 — Production Deployment & Operations Guide

## 1. Quick Start (Local Development)

### 1.1 Start Python FastAPI ML Service
```bash
cd ml
pip install -r requirements.txt
python src/app.py
# Runs on http://localhost:8000
```

### 1.2 Start Node.js Guardian Gateway
```bash
cd backend
npm install
npm start
# Runs on http://localhost:5000 with Socket.IO telemetry
```

### 1.3 Start Next.js Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
# Dashboard accessible at http://localhost:3000
```

---

## 2. Docker Compose Deployment (Single Command)

To deploy the entire production stack (MongoDB 7.0, FastAPI ML, Node.js Gateway, Next.js Dashboard):

```bash
docker-compose up -d --build
```

### Service Map:
- **Frontend Dashboard**: `http://localhost:3000`
- **Guardian Gateway API**: `http://localhost:5000`
- **ML Inference API**: `http://localhost:8000`
- **MongoDB**: `localhost:27017`

---

## 3. Seeded Accounts & Test Credentials

- **Admin Account**: `admin@guardian.io` / `GuardianAdmin123!`
- **Developer Account**: `dev@guardian.io` / `GuardianDev123!`
- **Security Reviewer Account**: `reviewer@guardian.io` / `GuardianReviewer123!`
- **Operations Approver Account**: `approver@guardian.io` / `GuardianApprover123!`
- **Demo AI Agent**: `agent-support-01`
- **Demo Agent API Key**: `ga_live_demo_secret_key_12345`

---

## 4. Running Verification Test Suites

```bash
# Backend unit & security integration tests
cd backend
npm test

# Attack simulator test (8 scenarios)
npm run test:simulator

# ML untouched test set evaluation
cd ../ml
python src/evaluate.py
```
