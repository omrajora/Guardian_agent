const weatherTool = require('./weatherTool');
const emailTool = require('./emailTool');
const databaseTool = require('./databaseTool');
const { verifyExecutionToken } = require('../utils/executionToken');

const toolMap = new Map();
toolMap.set(weatherTool.id, weatherTool);
toolMap.set(emailTool.id, emailTool);
toolMap.set(databaseTool.id, databaseTool);

class DirectBypassError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DirectBypassError';
    this.statusCode = 403;
  }
}

/**
 * Executes a tool ONLY if a valid Guardian execution token is provided.
 */
async function executeAuthorizedTool(toolId, parameters, executionToken) {
  const tool = toolMap.get(toolId);
  if (!tool) {
    throw new Error(`Tool '${toolId}' is not registered`);
  }

  // Enforce Direct Bypass Prevention
  const verified = verifyExecutionToken(executionToken, toolId);
  if (!verified) {
    throw new DirectBypassError(
      `SECURITY ALERT: Direct execution bypass attempt detected on tool '${toolId}'. Tool execution requires a valid Guardian security token.`
    );
  }

  return await tool.execute(parameters);
}

function getAvailableTools() {
  return Array.from(toolMap.values()).map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    sensitivity: t.sensitivity,
    destinations: t.destinations,
    schema: t.schema,
  }));
}

function getToolById(toolId) {
  return toolMap.get(toolId) || null;
}

module.exports = {
  executeAuthorizedTool,
  getAvailableTools,
  getToolById,
  DirectBypassError,
};
