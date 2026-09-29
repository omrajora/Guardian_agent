# 🚀 How to Run Guardian Agent 2.0 Website

Guardian Agent 2.0 consists of three coordinated services:
1. **Frontend Dashboard** (Next.js — Port `3000`)
2. **Backend Security Gateway** (Node.js/Express + Socket.IO — Port `5000`)
3. **ML Inference Service** (Python FastAPI — Port `8000`)

---

## ⚡ Option 1: 1-Click Startup (Easiest & Fastest)

Simply double-click:
👉 **[`start_all.bat`](file:///c:/Users/omraj/OneDrive/Desktop/guardian_agent/start_all.bat)**

*(Or in PowerShell run: `.\start_all.ps1`)*

This script automatically opens 3 dedicated windows for ML, Backend, and Frontend.

---

## 🖥️ Option 2: Manual Terminal Commands

Open **3 separate Terminal / PowerShell windows** and run the following:

### Window 1: Python ML Inference Service (Port 8000)
```powershell
cd c:\Users\omraj\OneDrive\Desktop\guardian_agent\ml
python src/app.py
```
> **URL**: `http://localhost:8000` (Health: `http://localhost:8000/health`)

---

### Window 2: Node.js Backend Gateway (Port 5000)
```powershell
cd c:\Users\omraj\OneDrive\Desktop\guardian_agent\backend
npm start
```
> **URL**: `http://localhost:5000` (Health: `http://localhost:5000/api/health`)
> *(Connects to database, seeds demo users & policies, and provides Socket.IO telemetry)*

---

### Window 3: Next.js Frontend Dashboard (Port 3000)
```powershell
cd c:\Users\omraj\OneDrive\Desktop\guardian_agent\frontend
npm run dev
```
> **Website URL**: **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Login Credentials

The system comes pre-seeded with initial accounts:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@guardian.io` | `GuardianAdmin123!` |
| **Developer** | `dev@guardian.io` | `GuardianDev123!` |
| **Security Reviewer** | `reviewer@guardian.io` | `GuardianReviewer123!` |
| **Approver** | `approver@guardian.io` | `GuardianApprover123!` |

**Pre-registered Demo Agent:**
- Agent ID: `agent-support-01`
- API Key: `ga_live_demo_secret_key_12345`

---

## 🧭 Dashboard Navigation

Once **[http://localhost:3000](http://localhost:3000)** opens in your browser:
- **Overview (`/`)**: Real-time KPI metrics, active Socket.IO telemetry stream, and risk classification breakdown.
- **Approvals (`/approvals`)**: Human-in-the-loop queue to authorize or reject paused high-risk actions.
- **Policies (`/policies`)**: Deterministic priority security rules and hard-deny controls.
- **Agents & Tools (`/agents`)**: Authenticated AI agent registry and protected tools.
- **Audit & Traces (`/audit`)**: Immutable, sanitized audit logs with decision filter.
- **Attack Simulator (`/simulator`)**: Interactive security suite executing 8 attack scenarios (prompt injection, bulk scraping, credential leakage, SQL delete, etc.).
- **ML Governance (`/models`)**: Model versions, precision, recall, and latency metrics.

---

## 🧪 Automated Testing Commands

To run all unit and attack simulation tests from the terminal:

```powershell
# 1. Run core test suite (11/11 tests pass):
cd c:\Users\omraj\OneDrive\Desktop\guardian_agent\backend
npm test

# 2. Run attack simulation test (8/8 scenarios pass):
npm run test:simulator

# 3. Run ML evaluation on untouched test set:
cd c:\Users\omraj\OneDrive\Desktop\guardian_agent\ml
python src/evaluate.py
```
