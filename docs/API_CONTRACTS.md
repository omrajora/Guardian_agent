# Guardian Agent 2.0 — API Contracts

This specification defines the REST API endpoints and data payloads across Backend and ML services.

---

## 1. Guardian Gateway Endpoints

### 1.1 `POST /api/guardian/evaluate`
Evaluates an action request without executing it (dry-run/pre-flight inspection).

**Headers**:
- `x-agent-id`: Agent identifier
- `x-agent-api-key`: Agent secret token

**Request Body**:
```json
{
  "toolId": "customer_db",
  "action": "export",
  "parameters": {
    "filter": "status=active",
    "limit": 100
  },
  "destination": "https://analytics.internal.net",
  "context": {
    "intent": "Generate monthly active user report"
  }
}
```

**Response (`200 OK`)**:
```json
{
  "actionId": "act_8971f1a2-...",
  "decision": "ALLOW", // "ALLOW" | "APPROVAL_REQUIRED" | "BLOCK"
  "riskLevel": "LOW",  // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  "reason": "Routine read operation within volume threshold",
  "findings": {
    "piiDetected": false,
    "secretsDetected": false,
    "matchedPolicies": ["allow_internal_reads"]
  },
  "mlScore": {
    "predictedRisk": "LOW",
    "probabilities": { "LOW": 0.94, "MEDIUM": 0.05, "HIGH": 0.01, "CRITICAL": 0.0 }
  },
  "anomalyScore": 0.12,
  "requiresApproval": false,
  "evaluatedAt": "2026-09-28T16:50:00.000Z"
}
```

---

### 1.2 `POST /api/guardian/execute`
Evaluates the request through the complete security pipeline and executes the tool if permitted (`ALLOW`). If `APPROVAL_REQUIRED`, pauses and puts in approval queue. If `BLOCK`, aborts with 403 Forbidden.

**Request Body**: Same as `/evaluate`.

**Response (`200 OK` on ALLOW)**:
```json
{
  "actionId": "act_8971f1a2-...",
  "decision": "ALLOW",
  "status": "EXECUTED",
  "result": {
    "status": "success",
    "recordsRetrieved": 100,
    "payload": [ ... ]
  }
}
```

**Response (`202 Accepted` on APPROVAL_REQUIRED)**:
```json
{
  "actionId": "act_8971f1a2-...",
  "decision": "APPROVAL_REQUIRED",
  "status": "WAITING_APPROVAL",
  "approvalId": "appr_456...",
  "reason": "Bulk export over 50 records requires human approval",
  "expiresAt": "2026-09-28T17:50:00.000Z"
}
```

**Response (`403 Forbidden` on BLOCK)**:
```json
{
  "actionId": "act_8971f1a2-...",
  "decision": "BLOCK",
  "status": "BLOCKED",
  "reason": "Hard security policy violation: direct DROP/DELETE database command prohibited"
}
```

---

## 2. ML Inference Endpoints (FastAPI — Port 8000)

### 2.1 `POST /api/ml/predict`
Multiclass classification of action risk.

**Request Body**:
```json
{
  "action": "export",
  "toolCategory": "EXPORT",
  "toolSensitivity": "CONFIDENTIAL",
  "dataType": "PII",
  "destinationType": "unknown_external",
  "volume": 5000,
  "agentRole": "support_agent",
  "hourOfDay": 22,
  "recentFailedActions": 3
}
```

**Response (`200 OK`)**:
```json
{
  "modelVersion": "guardian-xgb-v1.0.0",
  "predictedRisk": "HIGH",
  "probabilities": {
    "LOW": 0.02,
    "MEDIUM": 0.11,
    "HIGH": 0.81,
    "CRITICAL": 0.06
  },
  "inferenceLatencyMs": 4.2
}
```

---

### 2.2 `POST /api/ml/anomaly`
Unsupervised anomaly detection (Isolation Forest).

**Request Body**:
```json
{
  "agentId": "support-agent-01",
  "requestsLastHour": 450,
  "volumeRequested": 25000,
  "isNewDestination": true,
  "failedRatioLastHour": 0.4
}
```

**Response (`200 OK`)**:
```json
{
  "isAnomaly": true,
  "anomalyScore": 0.88,
  "severity": "HIGH",
  "deviationSummary": "Hourly volume 450 exceeds baseline max (300); unknown external destination."
}
```

---

## 3. Human Approval & Management Endpoints

| Method | Endpoint | Purpose | Required Role |
|---|---|---|---|
| `GET` | `/api/approvals/pending` | List pending requests | `Approver`, `Admin` |
| `POST` | `/api/approvals/:id/approve` | Approve action & trigger execution | `Approver`, `Admin` |
| `POST` | `/api/approvals/:id/reject` | Reject action | `Approver`, `Admin` |
| `GET` | `/api/audit-logs` | Query filtered audit timeline | `Security Reviewer`, `Admin` |
| `GET` | `/api/models` | List trained ML models & metrics | All authenticated |
| `POST` | `/api/simulator/run` | Execute attack simulator scenarios | `Developer`, `Admin` |
| `GET` | `/api/analytics/overview` | High-level metrics for dashboard | All authenticated |
