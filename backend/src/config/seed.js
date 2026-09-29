const User = require('../models/User');
const Tool = require('../models/Tool');
const Policy = require('../models/Policy');
const Agent = require('../models/Agent');
const { getAvailableTools } = require('../tools/toolExecutor');
const { hashApiKey } = require('../utils/apiKey');

async function seedDatabase() {
  console.log('[Seed] Checking baseline database records...');

  // 1. Seed Users
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('[Seed] Seeding default RBAC users...');
    const users = [
      {
        name: 'Security Admin',
        email: 'admin@guardian.io',
        passwordHash: await User.hashPassword('GuardianAdmin123!'),
        role: 'Admin',
      },
      {
        name: 'AI Agent Developer',
        email: 'dev@guardian.io',
        passwordHash: await User.hashPassword('GuardianDev123!'),
        role: 'Developer',
      },
      {
        name: 'Security Reviewer',
        email: 'reviewer@guardian.io',
        passwordHash: await User.hashPassword('GuardianReviewer123!'),
        role: 'Security Reviewer',
      },
      {
        name: 'Operations Approver',
        email: 'approver@guardian.io',
        passwordHash: await User.hashPassword('GuardianApprover123!'),
        role: 'Approver',
      },
    ];
    await User.insertMany(users);
    console.log('[Seed] Seeded 4 initial users.');
  }

  // 2. Seed Default Tools
  const toolDefs = getAvailableTools();
  for (const t of toolDefs) {
    const existing = await Tool.findOne({ toolId: t.id });
    if (!existing) {
      await Tool.create({
        toolId: t.id,
        name: t.name,
        category: t.category,
        sensitivity: t.sensitivity,
        schema: t.schema,
        destinations: t.destinations,
        isSensitive: t.sensitivity === 'CONFIDENTIAL' || t.category === 'DELETE',
        enabled: true,
      });
      console.log(`[Seed] Seeded tool: ${t.id}`);
    }
  }

  // 3. Seed Default Policies
  const policies = [
    {
      policyId: 'pol_hard_deny_db_delete',
      name: 'Block Direct Database Deletions',
      description: 'Hard-deny any destructive deletion query on the customer database without elevated escalation',
      priority: 1,
      conditions: {
        toolIds: ['customer_db'],
        actionTypes: ['delete'],
      },
      decision: 'BLOCK',
      severity: 'CRITICAL',
      isHardDeny: true,
      enabled: true,
    },
    {
      policyId: 'pol_bulk_export_approval',
      name: 'Bulk Export Requires Approval',
      description: 'Any customer data export exceeding 50 records requires human supervisor sign-off',
      priority: 10,
      conditions: {
        toolIds: ['customer_db'],
        actionTypes: ['export'],
        volumeThreshold: 50,
      },
      decision: 'APPROVAL_REQUIRED',
      severity: 'HIGH',
      isHardDeny: false,
      enabled: true,
    },
    {
      policyId: 'pol_block_secrets_in_payload',
      name: 'Block Raw API Secrets & Credentials',
      description: 'Block any request payload that contains raw API keys, tokens, or private keys',
      priority: 2,
      conditions: {
        containsSecrets: true,
      },
      decision: 'BLOCK',
      severity: 'CRITICAL',
      isHardDeny: true,
      enabled: true,
    },
    {
      policyId: 'pol_email_pii_approval',
      name: 'Email with PII Requires Approval',
      description: 'Sending emails containing detected PII requires human reviewer sign-off',
      priority: 15,
      conditions: {
        toolIds: ['email_sender'],
        containsPii: true,
      },
      decision: 'APPROVAL_REQUIRED',
      severity: 'HIGH',
      isHardDeny: false,
      enabled: true,
    },
  ];

  for (const p of policies) {
    const existing = await Policy.findOne({ policyId: p.policyId });
    if (!existing) {
      await Policy.create(p);
      console.log(`[Seed] Seeded policy: ${p.policyId}`);
    }
  }

  // 4. Seed Demo Agent
  const demoAgent = await Agent.findOne({ agentId: 'agent-support-01' });
  if (!demoAgent) {
    const adminUser = await User.findOne({ email: 'admin@guardian.io' });
    const rawKey = 'ga_live_demo_secret_key_12345';
    await Agent.create({
      agentId: 'agent-support-01',
      name: 'Customer Support Autonomous Agent',
      description: 'AI agent handling automated customer queries, order lookups, and support emails',
      ownerId: adminUser._id,
      permissions: ['read:customer', 'write:email'],
      allowedTools: ['weather_api', 'customer_db', 'email_sender'],
      apiKeyHash: hashApiKey(rawKey),
      apiKeyPrefix: rawKey.substring(0, 12),
      status: 'active',
      baseline: {
        normalCallsPerHour: 120,
        normalRecordsPerRequest: 25,
        typicalDestinations: ['https://api.weather.internal', 'db.internal.cluster:5432'],
        typicalActions: ['read', 'lookup'],
      },
    });
    console.log(`[Seed] Seeded demo agent: agent-support-01 (API Key: ${rawKey})`);
  }

  // 5. Seed Active ML Model Version
  const ModelVersion = require('../models/ModelVersion');
  const existingModel = await ModelVersion.findOne({ version: 'v1.0.0' });
  if (!existingModel) {
    await ModelVersion.create({
      name: 'guardian-risk-randomforest',
      version: 'v1.0.0',
      algorithm: 'RandomForest',
      datasetVersion: 'v1.0.0',
      metrics: {
        accuracy: 1.0,
        precision: 1.0,
        recall: 1.0,
        f1Score: 1.0,
        rocAuc: 0.999,
        latencyP95Ms: 16.7,
      },
      active: true,
      weightsPath: 'ml/models/best_model.joblib',
      featureColumns: [
        'action',
        'toolCategory',
        'toolSensitivity',
        'dataType',
        'destinationType',
        'agentRole',
        'volume',
        'hourOfDay',
        'recentFailedActions',
      ],
    });
    console.log('[Seed] Seeded active model version: v1.0.0 (RandomForest)');
  }
}

module.exports = { seedDatabase };
