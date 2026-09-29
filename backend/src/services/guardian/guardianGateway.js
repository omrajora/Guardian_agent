const { v4: uuidv4 } = require('uuid');
const Tool = require('../../models/Tool');
const ActionRequest = require('../../models/ActionRequest');
const { scanObject, redactPayload } = require('../pii/piiScanner');
const { evaluatePolicies } = require('../policy/policyEngine');
const { createApprovalRequest } = require('../approval/approvalService');
const { recordAudit } = require('../audit/auditService');
const { createExecutionToken } = require('../../utils/executionToken');
const { executeAuthorizedTool } = require('../../tools/toolExecutor');

// ML & Anomaly clients (plugged in Track C; safe fallback in Track A)
let mlRiskClient = null;
let anomalyClient = null;
let llmClient = null;

function registerMLClients({ riskClient, anomClient, llmReasoner }) {
  if (riskClient) mlRiskClient = riskClient;
  if (anomClient) anomalyClient = anomClient;
  if (llmReasoner) llmClient = llmReasoner;
}

/**
 * Evaluates an action request through the complete Guardian Security Gateway.
 * If execute = true and decision = ALLOW, executes the tool.
 */
async function processGuardianAction({
  agent,
  toolId,
  action,
  parameters = {},
  destination,
  context = {},
  execute = false,
}) {
  const actionId = `act_${uuidv4()}`;

  // 1. Tool authorization & schema validation
  if (!agent.allowedTools.includes(toolId)) {
    const reason = `Security violation: Agent '${agent.agentId}' is not authorized to invoke tool '${toolId}'`;
    await recordAudit({
      actionId,
      eventType: 'BLOCK',
      actor: { type: 'AGENT', id: agent.agentId },
      decision: 'BLOCK',
      reason,
      metadata: { toolId, action },
    });
    return {
      actionId,
      decision: 'BLOCK',
      riskLevel: 'CRITICAL',
      status: 'BLOCKED',
      reason,
      findings: { piiDetected: false, secretsDetected: false, matchedPolicies: ['agent_allowed_tools_whitelist'] },
    };
  }

  const tool = await Tool.findOne({ toolId });
  if (!tool || !tool.enabled) {
    const reason = `Tool '${toolId}' is not registered or is disabled`;
    await recordAudit({
      actionId,
      eventType: 'BLOCK',
      actor: { type: 'AGENT', id: agent.agentId },
      decision: 'BLOCK',
      reason,
      metadata: { toolId },
    });
    return {
      actionId,
      decision: 'BLOCK',
      riskLevel: 'HIGH',
      status: 'BLOCKED',
      reason,
      findings: { piiDetected: false, secretsDetected: false, matchedPolicies: [] },
    };
  }

  // Destination allow-list check: Mandatory Control (PRD 11.1)
  let isUnknownDestination = false;
  if (destination && tool.destinations && tool.destinations.length > 0) {
    if (!tool.destinations.includes(destination)) {
      isUnknownDestination = true;
      // If destination is not in tool's allow-list, enforce mandatory block
      const reason = `Security violation: Destination '${destination}' is not in authorized allow-list for tool '${toolId}'`;
      await recordAudit({
        actionId,
        eventType: 'BLOCK',
        actor: { type: 'AGENT', id: agent.agentId },
        decision: 'BLOCK',
        reason,
        metadata: { toolId, destination },
      });
      return {
        actionId,
        decision: 'BLOCK',
        riskLevel: 'CRITICAL',
        status: 'BLOCKED',
        reason,
        findings: { piiDetected: false, secretsDetected: false, matchedPolicies: ['destination_allowlist_mandatory_control'] },
      };
    }
  }

  // 2. Deterministic PII & Secret Scan
  const scanResult = scanObject(parameters);
  const sanitizedParams = redactPayload(parameters);

  // Extract structured features for ML / Rule evaluation
  const volume = typeof parameters.limit === 'number' ? parameters.limit : 1;
  const features = {
    action: action.toLowerCase(),
    toolCategory: tool.category,
    toolSensitivity: tool.sensitivity,
    dataType: scanResult.secretsDetected ? 'credential/secret' : scanResult.piiDetected ? 'PII' : 'internal',
    destinationType: isUnknownDestination ? 'unknown_external' : 'trusted_internal',
    volume,
    agentRole: agent.permissions[0] || 'default_agent',
    hourOfDay: new Date().getHours(),
    recentFailedActions: 0,
  };

  // 3. Deterministic Policy Evaluation
  const policyResult = await evaluatePolicies({
    toolId,
    action,
    parameters,
    destination,
    toolSensitivity: tool.sensitivity,
    piiDetected: scanResult.piiDetected,
    secretsDetected: scanResult.secretsDetected,
    volume,
  });

  // 4. ML Risk Prediction (if available)
  let mlInference = null;
  if (mlRiskClient) {
    try {
      mlInference = await mlRiskClient.predictRisk(features);
    } catch (mlErr) {
      console.warn('[Guardian] ML inference fallback:', mlErr.message);
    }
  }

  // 5. Anomaly Detection (if available)
  let anomalyInference = null;
  if (anomalyClient) {
    try {
      anomalyInference = await anomalyClient.checkAnomaly({
        agentId: agent.agentId,
        volumeRequested: volume,
        destination,
        action,
      });
    } catch (anomErr) {
      console.warn('[Guardian] Anomaly inference fallback:', anomErr.message);
    }
  }

  // 6. Optional LLM Contextual Reasoning (if available)
  let llmAnalysis = null;
  if (llmClient) {
    try {
      llmAnalysis = await llmClient.analyzeContext({
        toolId,
        action,
        parameters: sanitizedParams,
        context,
      });
    } catch (llmErr) {
      console.warn('[Guardian] LLM contextual analysis fallback:', llmErr.message);
    }
  }

  // 7. Decision Fusion & Signal Arbitration
  // HARD RULES RULE: Hard deny cannot be overridden by ML or LLM
  let finalDecision = policyResult.decision;
  let finalReason = policyResult.reason;
  let finalRiskLevel = policyResult.severity;

  if (policyResult.isHardBlocked) {
    finalDecision = 'BLOCK';
  } else {
    // If not hard-blocked, incorporate ML & Anomaly risk signals
    if (mlInference?.predictedRisk === 'CRITICAL' || mlInference?.probabilities?.CRITICAL > 0.7) {
      finalDecision = 'BLOCK';
      finalReason = `ML model predicted CRITICAL security risk (${(mlInference.probabilities.CRITICAL * 100).toFixed(1)}% prob)`;
      finalRiskLevel = 'CRITICAL';
    } else if (mlInference?.predictedRisk === 'HIGH' || anomalyInference?.isAnomaly) {
      if (finalDecision !== 'BLOCK') {
        finalDecision = 'APPROVAL_REQUIRED';
        finalReason = anomalyInference?.isAnomaly
          ? `Behavioral anomaly detected (${anomalyInference.deviationFactors?.join(', ') || 'unusual spike'})`
          : `ML model predicted HIGH risk (${(mlInference.probabilities.HIGH * 100).toFixed(1)}% prob)`;
        finalRiskLevel = 'HIGH';
      }
    }
  }

  // 8. Persist ActionRequest Record
  const actionRequest = await ActionRequest.create({
    actionId,
    agentId: agent.agentId,
    toolId,
    action,
    parameters,
    sanitizedParameters: sanitizedParams,
    destination,
    features,
    findings: {
      piiDetected: scanResult.piiDetected,
      piiTypes: scanResult.piiTypes,
      secretsDetected: scanResult.secretsDetected,
      matchedPolicies: policyResult.matchedPolicies,
    },
    mlInference,
    anomalyInference,
    llmAnalysis,
    finalRiskLevel,
    decision: finalDecision,
    decisionReason: finalReason,
    executionStatus: finalDecision === 'ALLOW' ? 'PENDING' : finalDecision === 'BLOCK' ? 'BLOCKED' : 'WAITING_APPROVAL',
  });

  // 9. Execute or Route to Approval Queue
  let executionResult = null;
  let approvalData = null;

  if (finalDecision === 'APPROVAL_REQUIRED') {
    approvalData = await createApprovalRequest({
      actionRequestId: actionRequest._id,
      actionId,
      agentId: agent.agentId,
      toolId,
      riskLevel: finalRiskLevel,
      reason: finalReason,
    });
  } else if (finalDecision === 'ALLOW' && execute) {
    const executionToken = createExecutionToken(actionId, toolId, agent.agentId);
    try {
      executionResult = await executeAuthorizedTool(toolId, parameters, executionToken);
      actionRequest.executionStatus = 'EXECUTED';
      actionRequest.executionResult = executionResult;
      await actionRequest.save();

      await recordAudit({
        actionId,
        eventType: 'EXECUTION',
        actor: { type: 'AGENT', id: agent.agentId },
        decision: 'ALLOW',
        reason: 'Tool executed successfully under Guardian authorization',
        metadata: { toolId, action, executionResult },
      });
    } catch (toolErr) {
      actionRequest.executionStatus = 'FAILED';
      actionRequest.executionResult = { error: toolErr.message };
      await actionRequest.save();
      throw toolErr;
    }
  } else {
    // Audit decision
    await recordAudit({
      actionId,
      eventType: finalDecision === 'BLOCK' ? 'BLOCK' : 'EVALUATION',
      actor: { type: 'AGENT', id: agent.agentId },
      decision: finalDecision,
      reason: finalReason,
      metadata: { toolId, action, findings: actionRequest.findings },
    });
  }

  return {
    actionId,
    decision: finalDecision,
    riskLevel: finalRiskLevel,
    status: actionRequest.executionStatus,
    reason: finalReason,
    findings: actionRequest.findings,
    mlInference,
    anomalyInference,
    llmAnalysis,
    approval: approvalData ? { id: approvalData._id, expiresAt: approvalData.expiresAt } : null,
    result: executionResult,
  };
}

module.exports = {
  processGuardianAction,
  registerMLClients,
};
