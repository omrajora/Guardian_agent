const Policy = require('../models/Policy');

async function listPolicies(req, res, next) {
  try {
    const policies = await Policy.find().sort({ priority: 1 });
    res.json({ count: policies.length, policies });
  } catch (err) {
    next(err);
  }
}

async function createPolicy(req, res, next) {
  try {
    const policy = await Policy.create(req.body);
    res.status(201).json({ message: 'Policy created successfully', policy });
  } catch (err) {
    next(err);
  }
}

async function updatePolicy(req, res, next) {
  try {
    const { policyId } = req.params;
    const updated = await Policy.findOneAndUpdate({ policyId }, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Not Found', message: `Policy '${policyId}' not found` });
    }
    res.json({ message: 'Policy updated', policy: updated });
  } catch (err) {
    next(err);
  }
}

async function deletePolicy(req, res, next) {
  try {
    const { policyId } = req.params;
    const deleted = await Policy.findOneAndDelete({ policyId });
    if (!deleted) {
      return res.status(404).json({ error: 'Not Found', message: `Policy '${policyId}' not found` });
    }
    res.json({ message: 'Policy deleted', policyId });
  } catch (err) {
    next(err);
  }
}

async function seedDefaultPolicies(req, res, next) {
  try {
    const defaults = [
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

    const seeded = [];
    for (const p of defaults) {
      let doc = await Policy.findOne({ policyId: p.policyId });
      if (!doc) {
        doc = await Policy.create(p);
        seeded.push(doc);
      }
    }

    res.json({ message: 'Default policies seeded', seededCount: seeded.length, policies: seeded });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
  seedDefaultPolicies,
};
