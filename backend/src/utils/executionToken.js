const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const EXECUTION_TOKEN_SECRET = process.env.JWT_SECRET || 'guardian-execution-internal-secret';

/**
 * Creates an authorized execution token for a validated action.
 * Tools verify this token before running to prevent direct execution bypasses.
 */
function createExecutionToken(actionId, toolId, agentId) {
  return jwt.sign(
    {
      actionId,
      toolId,
      agentId,
      scope: 'guardian:execute',
      nonce: crypto.randomBytes(8).toString('hex'),
    },
    EXECUTION_TOKEN_SECRET,
    { expiresIn: '30s' } // Short-lived single action token
  );
}

/**
 * Validates the execution token presented to a tool.
 */
function verifyExecutionToken(token, expectedToolId) {
  try {
    const payload = jwt.verify(token, EXECUTION_TOKEN_SECRET);
    if (payload.scope !== 'guardian:execute') return false;
    if (expectedToolId && payload.toolId !== expectedToolId) return false;
    return payload;
  } catch (err) {
    return false;
  }
}

module.exports = {
  createExecutionToken,
  verifyExecutionToken,
};
