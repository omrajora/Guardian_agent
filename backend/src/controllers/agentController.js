const Agent = require('../models/Agent');
const { generateApiKey, hashApiKey } = require('../utils/apiKey');

async function createAgent(req, res, next) {
  try {
    const { agentId, name, description, permissions, allowedTools, baseline } = req.body;

    const existing = await Agent.findOne({ agentId });
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: `Agent '${agentId}' already exists` });
    }

    const { apiKey, apiKeyPrefix, apiKeyHash } = generateApiKey();

    const agent = await Agent.create({
      agentId,
      name,
      description,
      ownerId: req.user._id,
      permissions: permissions || [],
      allowedTools: allowedTools || ['weather_api'],
      apiKeyHash,
      apiKeyPrefix,
      status: 'active',
      baseline: baseline || {
        normalCallsPerHour: 100,
        normalRecordsPerRequest: 50,
        typicalDestinations: [],
        typicalActions: ['read'],
      },
    });

    res.status(201).json({
      message: 'Agent registered successfully',
      agent: {
        agentId: agent.agentId,
        name: agent.name,
        permissions: agent.permissions,
        allowedTools: agent.allowedTools,
        apiKeyPrefix: agent.apiKeyPrefix,
        status: agent.status,
        baseline: agent.baseline,
      },
      apiKey, // Shown ONLY ONCE upon creation
      warning: 'Store this API key securely. It will not be shown again.',
    });
  } catch (err) {
    next(err);
  }
}

async function listAgents(req, res, next) {
  try {
    const agents = await Agent.find().select('-apiKeyHash').populate('ownerId', 'name email');
    res.json({ count: agents.length, agents });
  } catch (err) {
    next(err);
  }
}

async function rotateApiKey(req, res, next) {
  try {
    const { agentId } = req.params;
    const agent = await Agent.findOne({ agentId });
    if (!agent) {
      return res.status(404).json({ error: 'Not Found', message: `Agent '${agentId}' not found` });
    }

    const { apiKey, apiKeyPrefix, apiKeyHash } = generateApiKey();
    agent.apiKeyHash = apiKeyHash;
    agent.apiKeyPrefix = apiKeyPrefix;
    await agent.save();

    res.json({
      message: 'API Key rotated successfully',
      agentId: agent.agentId,
      apiKeyPrefix,
      newApiKey: apiKey,
      warning: 'Store this new API key securely. Previous key is revoked immediately.',
    });
  } catch (err) {
    next(err);
  }
}

async function getAgent(req, res, next) {
  try {
    const { agentId } = req.params;
    const agent = await Agent.findOne({ agentId }).select('-apiKeyHash').populate('ownerId', 'name email');
    if (!agent) {
      return res.status(404).json({ error: 'Not Found', message: `Agent '${agentId}' not found` });
    }
    res.json({ agent });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAgent,
  listAgents,
  rotateApiKey,
  getAgent,
};
