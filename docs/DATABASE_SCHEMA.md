# Guardian Agent 2.0 — Database Schema Specification

This document specifies the MongoDB collections and Mongoose models matching section 14 of the PRD/SRS.

---

## 1. Collections & Field Definitions

### 1.1 `users`
Represents dashboard operators, developers, approvers, and security reviewers.
```typescript
interface IUser {
  _id: ObjectId;
  name: string;
  email: string; // unique, indexed
  passwordHash: string;
  role: 'Admin' | 'Developer' | 'Security Reviewer' | 'Approver';
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.2 `agents`
Represents registered AI agents issuing tool execution requests.
```typescript
interface IAgent {
  _id: ObjectId;
  agentId: string; // unique identifier e.g. "agent-support-01"
  name: string;
  description?: string;
  ownerId: ObjectId; // ref to users
  permissions: string[]; // e.g. ['read:customer', 'write:email']
  allowedTools: string[]; // tool IDs allowed for this agent
  apiKeyHash: string; // SHA-256 hash of agent bearer key
  apiKeyPrefix: string; // e.g. "ga_live_xxxx"
  status: 'active' | 'revoked' | 'sandbox';
  baseline: {
    normalCallsPerHour: number;
    normalRecordsPerRequest: number;
    typicalDestinations: string[];
    typicalActions: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.3 `tools`
Tools registered within the ecosystem that can be invoked via Guardian.
```typescript
interface ITool {
  _id: ObjectId;
  toolId: string; // e.g. "weather_api", "sql_executor", "customer_db", "email_sender"
  name: string;
  category: 'READ' | 'WRITE' | 'DELETE' | 'EXECUTE' | 'EXPORT' | 'COMMUNICATION';
  description: string;
  sensitivity: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  schema: Record<string, any>; // JSON schema of inputs
  destinations: string[]; // Destination URLs or hostnames
  isSensitive: boolean; // Triggers stricter scrutiny
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.4 `policies`
Configurable deterministic rules applied before ML inference.
```typescript
interface IPolicy {
  _id: ObjectId;
  policyId: string;
  name: string;
  description?: string;
  priority: number; // lower integer = evaluated earlier (e.g. 1-100)
  conditions: {
    actionTypes?: string[];
    toolIds?: string[];
    destinations?: string[];
    sensitivityLevels?: string[];
    containsPii?: boolean;
    containsSecrets?: boolean;
    volumeThreshold?: number;
  };
  decision: 'ALLOW' | 'APPROVAL_REQUIRED' | 'BLOCK';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isHardDeny: boolean; // cannot be overridden by ML or approval
  version: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.5 `action_requests`
Each tool request evaluated or executed through Guardian.
```typescript
interface IActionRequest {
  _id: ObjectId;
  actionId: string; // unique UUIDv4
  agentId: string;
  toolId: string;
  parameters: Record<string, any>;
  sanitizedParameters: Record<string, any>;
  destination?: string;
  features: {
    action: string;
    toolCategory: string;
    toolSensitivity: string;
    dataType: string;
    destinationType: string;
    volume: number;
    agentRole: string;
    hourOfDay: number;
    recentFailedActions: number;
  };
  findings: {
    piiDetected: boolean;
    piiTypes: string[];
    secretsDetected: boolean;
    matchedPolicies: string[];
  };
  mlInference?: {
    modelVersion: string;
    predictedRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    probabilities: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      CRITICAL: number;
    };
    latencyMs: number;
  };
  anomalyInference?: {
    anomalyScore: number;
    isAnomaly: boolean;
    deviationFactors: string[];
  };
  llmAnalysis?: {
    intent: string;
    injectionSuspicion: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    contextExplanation: string;
    riskRationale: string;
  };
  finalRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  decision: 'ALLOW' | 'APPROVAL_REQUIRED' | 'BLOCK';
  decisionReason: string;
  executionStatus: 'PENDING' | 'EXECUTED' | 'BLOCKED' | 'FAILED' | 'WAITING_APPROVAL';
  executionResult?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.6 `approvals`
Pending and processed human reviewer approvals.
```typescript
interface IApproval {
  _id: ObjectId;
  actionRequestId: ObjectId; // ref to action_requests
  actionId: string;
  agentId: string;
  toolId: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  approvalToken: string; // one-time cryptographic token
  reviewerId?: ObjectId; // ref to users
  reason?: string;
  expiresAt: Date;
  decidedAt?: Date;
  createdAt: Date;
}
```

### 1.7 `audit_logs`
Immutable security and event audit records.
```typescript
interface IAuditLog {
  _id: ObjectId;
  actionId: string;
  eventType: 'EVALUATION' | 'EXECUTION' | 'BLOCK' | 'APPROVAL_REQUESTED' | 'APPROVAL_GRANTED' | 'APPROVAL_DENIED' | 'ANOMALY_TRIGGERED' | 'PII_DETECTED';
  actor: {
    type: 'AGENT' | 'USER' | 'SYSTEM';
    id: string;
  };
  decision: 'ALLOW' | 'APPROVAL_REQUIRED' | 'BLOCK';
  reason: string;
  metadata: Record<string, any>; // sanitized
  timestamp: Date;
}
```

### 1.8 `model_versions`
Tracks trained and active ML models.
```typescript
interface IModelVersion {
  _id: ObjectId;
  name: string; // e.g. "guardian-risk-xgb"
  version: string; // e.g. "v1.2.0"
  algorithm: 'LogisticRegression' | 'RandomForest' | 'XGBoost';
  datasetVersion: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    rocAuc?: number;
    latencyP95Ms?: number;
  };
  active: boolean;
  weightsPath: string;
  featureColumns: string[];
  createdAt: Date;
}
```

### 1.9 `anomaly_profiles`
Agent behavior profiles for Isolation Forest baseline.
```typescript
interface IAnomalyProfile {
  _id: ObjectId;
  agentId: string;
  baselineFeatures: {
    avgHourlyVolume: number;
    maxSingleRequestRecords: number;
    knownDestinations: string[];
    actionTypeDistribution: Record<string, number>;
  };
  updatedAt: Date;
}
```
