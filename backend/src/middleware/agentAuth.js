const Agent = require('../models/Agent');
const { hashApiKey } = require('../utils/apiKey');

async function authenticateAgent(req, res, next) {
  const agentId = req.headers['x-agent-id'];
  const apiKey = req.headers['x-agent-api-key'];

  if (!agentId || !apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing agent credentials in headers. Provide x-agent-id and x-agent-api-key.',
    });
  }

  try {
    const agent = await Agent.findOne({ agentId });
    if (!agent) {
      return res.status(401).json({ error: 'Unauthorized', message: `Unknown agent '${agentId}'` });
    }

    if (agent.status !== 'active') {
      return res.status(403).json({ error: 'Forbidden', message: `Agent '${agentId}' is ${agent.status}` });
    }

    const computedHash = hashApiKey(apiKey);
    if (computedHash !== agent.apiKeyHash) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid agent API key' });
    }

    req.agent = agent;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}

module.exports = { authenticateAgent };
