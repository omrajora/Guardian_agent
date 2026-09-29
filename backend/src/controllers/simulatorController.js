const { runScenario, listScenarios } = require('../services/simulator/simulatorService');

async function getScenarios(req, res) {
  res.json({ scenarios: listScenarios() });
}

async function executeScenario(req, res, next) {
  try {
    const { scenarioKey } = req.body;
    if (!scenarioKey) {
      return res.status(400).json({ error: 'Missing scenarioKey' });
    }
    const result = await runScenario(scenarioKey);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getScenarios,
  executeScenario,
};
