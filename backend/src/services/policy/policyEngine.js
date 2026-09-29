const Policy = require('../../models/Policy');

/**
 * Deterministic Policy Engine
 * Evaluates request context against active policies sorted by priority.
 */
async function evaluatePolicies(context) {
  const {
    toolId,
    action,
    parameters = {},
    destination,
    toolSensitivity,
    piiDetected,
    secretsDetected,
    volume = 1,
  } = context;

  // Retrieve active policies ordered by priority
  const activePolicies = await Policy.find({ enabled: true }).sort({ priority: 1 });

  const matchedPolicies = [];
  let finalDecision = 'ALLOW';
  let decisionReason = 'Default allow: no restricting security policy triggered';
  let highestSeverity = 'LOW';
  let isHardBlocked = false;

  for (const policy of activePolicies) {
    const { conditions } = policy;
    let matches = true;

    if (conditions.toolIds && conditions.toolIds.length > 0) {
      if (!conditions.toolIds.includes(toolId)) matches = false;
    }

    if (matches && conditions.actionTypes && conditions.actionTypes.length > 0) {
      if (!conditions.actionTypes.includes(action.toLowerCase())) matches = false;
    }

    if (matches && conditions.sensitivityLevels && conditions.sensitivityLevels.length > 0) {
      if (!conditions.sensitivityLevels.includes(toolSensitivity)) matches = false;
    }

    if (matches && conditions.containsPii !== undefined) {
      if (conditions.containsPii !== piiDetected) matches = false;
    }

    if (matches && conditions.containsSecrets !== undefined) {
      if (conditions.containsSecrets !== secretsDetected) matches = false;
    }

    if (matches && conditions.volumeThreshold !== undefined) {
      if (volume < conditions.volumeThreshold) matches = false;
    }

    if (matches && conditions.destinations && conditions.destinations.length > 0) {
      if (!destination || !conditions.destinations.includes(destination)) {
        matches = false;
      }
    }

    if (matches) {
      matchedPolicies.push(policy);

      // Hard-deny policies immediately terminate with BLOCK
      if (policy.isHardDeny || policy.decision === 'BLOCK') {
        finalDecision = 'BLOCK';
        decisionReason = `Hard-deny policy '${policy.name}' matched: ${policy.description || 'Prohibited action'}`;
        highestSeverity = policy.severity || 'CRITICAL';
        isHardBlocked = true;
        break; // Hard block cannot be overridden
      }

      if (policy.decision === 'APPROVAL_REQUIRED' && finalDecision !== 'BLOCK') {
        finalDecision = 'APPROVAL_REQUIRED';
        decisionReason = `Policy '${policy.name}' matched: human approval required`;
        highestSeverity = policy.severity || 'HIGH';
      }
    }
  }

  // Built-in hard guardrail: Any raw secret/token detected in parameters is hard-blocked by default
  if (!isHardBlocked && secretsDetected) {
    finalDecision = 'BLOCK';
    decisionReason = 'Critical security violation: Raw API key, credential, or secret token detected in parameters';
    highestSeverity = 'CRITICAL';
    isHardBlocked = true;
  }

  return {
    matchedPolicies: matchedPolicies.map((p) => p.name),
    decision: finalDecision,
    reason: decisionReason,
    severity: highestSeverity,
    isHardBlocked,
  };
}

module.exports = {
  evaluatePolicies,
};
