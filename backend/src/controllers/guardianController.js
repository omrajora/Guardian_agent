const { processGuardianAction } = require('../services/guardian/guardianGateway');

async function evaluateAction(req, res, next) {
  try {
    const { toolId, action, parameters, destination, context } = req.body;

    const evaluation = await processGuardianAction({
      agent: req.agent,
      toolId,
      action: action || 'read',
      parameters: parameters || {},
      destination,
      context,
      execute: false,
    });

    res.json(evaluation);
  } catch (err) {
    next(err);
  }
}

async function executeAction(req, res, next) {
  try {
    const { toolId, action, parameters, destination, context } = req.body;

    const outcome = await processGuardianAction({
      agent: req.agent,
      toolId,
      action: action || 'read',
      parameters: parameters || {},
      destination,
      context,
      execute: true,
    });

    if (outcome.decision === 'BLOCK') {
      return res.status(403).json({
        actionId: outcome.actionId,
        decision: 'BLOCK',
        status: 'BLOCKED',
        reason: outcome.reason,
        findings: outcome.findings,
      });
    }

    if (outcome.decision === 'APPROVAL_REQUIRED') {
      return res.status(202).json({
        actionId: outcome.actionId,
        decision: 'APPROVAL_REQUIRED',
        status: 'WAITING_APPROVAL',
        approvalId: outcome.approval?.id,
        reason: outcome.reason,
        expiresAt: outcome.approval?.expiresAt,
      });
    }

    res.json(outcome);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  evaluateAction,
  executeAction,
};
