# Guardian Agent 2.0 — Threat Model

## 1. Scope and Assets
Guardian Agent 2.0 acts as a security perimeter around autonomous AI agents invoking external APIs, databases, filesystems, and operational tools.

### Key Assets Protected:
- **Internal Database & Records**: Customer data, PII, financial records, configurations.
- **API Keys, Secrets & Credentials**: Environment variables, authentication tokens, cloud credentials.
- **External Communications**: Email dispatch, webhook calls, notification channels.
- **Infrastructure Integrity**: Shell execution, file modifications, deletion permissions.
- **Audit Trails**: Security logs, immutable action request records, incident tracking.

---

## 2. Threat Actors & Vectors

| Threat Actor | Vector | Objective | Mitigation |
|---|---|---|---|
| **Compromised/Jailbroken Agent** | Prompt injection via untrusted inputs leading to unauthorized tool invocations | Exfiltrate customer PII or run destructive commands | Interception gateway, strict schema validation, deterministic policy, ML risk prediction |
| **Malicious Actor Injecting Prompts** | Indirect prompt injection embedded in fetched web or email content | Hijack agent plan to call malicious external URLs | Destination allow-listing, PII scanners, hard-deny rules |
| **Over-permissioned Agent** | Agent querying 50,000 records instead of normal ~50 | Data scraping / wholesale exfiltration | Unsupervised Isolation Forest Anomaly Detection on volume & destination |
| **Insider / Rogue Developer** | Directly calling sensitive tools without Guardian | Evade security oversight and audit logs | Direct bypass prevention: tools only accept execution requests signed by Guardian tokens |
| **Credential Leakage** | Agent emitting raw API keys or passwords in tool payload | Expose tokens to logs, external endpoints | Deterministic regex/token scanner redacts secrets before persistence & transmission |

---

## 3. STRIDE Analysis

1. **Spoofing**:
   - *Threat*: Rogue client impersonating a registered AI agent.
   - *Mitigation*: Per-agent cryptographically hashed API keys (`apiKeyHash`), secret verification on every gateway request.
2. **Tampering**:
   - *Threat*: Modifying tool execution requests or audit records in transit.
   - *Mitigation*: Deterministic action ID hashing, input schema enforcement with Zod, immutable audit logs.
3. **Repudiation**:
   - *Threat*: Agent or reviewer denying taking an action.
   - *Mitigation*: Persistent audit log with action ID, actor identity, policy match trace, reviewer decision, and timestamp.
4. **Information Disclosure**:
   - *Threat*: Raw secrets or PII leaking in audit logs or API error responses.
   - *Mitigation*: Automated payload sanitization and masking (`***REDACTED***`) before database persistence and WebSocket broadcasting.
5. **Denial of Service**:
   - *Threat*: Agent flooding tool execution or ML inference endpoint.
   - *Mitigation*: Rate limiting, behavioral frequency anomaly tracking, ML inference timeouts with deterministic fail-closed fallback for sensitive tools.
6. **Elevation of Privilege**:
   - *Threat*: Agent attempting to run tools outside its allowed list or bypass human approval.
   - *Mitigation*: Hard RBAC and allowed tools list verified before any ML/LLM evaluation; one-time approval tokens that expire and cannot be reused.

---

## 4. Fail-Safe Principle
If an upstream service (such as the ML classifier or LLM reasoning service) is unavailable or times out:
- Routine safe tools (`READ`, `WEATHER`, `SEARCH`) degrade to deterministic policy enforcement.
- Sensitive tools (`DATABASE_DELETE`, `SHELL_EXECUTE`, `BULK_EXPORT`) enforce **fail-closed** behavior (`APPROVAL_REQUIRED` or `BLOCK`).
