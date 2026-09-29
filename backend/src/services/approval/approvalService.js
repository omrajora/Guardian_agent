const crypto = require('crypto');
const Approval = require('../../models/Approval');
const ActionRequest = require('../../models/ActionRequest');
const { createExecutionToken } = require('../../utils/executionToken');
const { executeAuthorizedTool } = require('../../tools/toolExecutor');
const { recordAudit } = require('../audit/auditService');

async function createApprovalRequest({ actionRequestId, actionId, agentId, toolId, riskLevel = 'MEDIUM', reason }) {
  const approvalToken = `appr_tok_${crypto.randomBytes(24).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

  const approval = await Approval.create({
    actionRequestId,
    actionId,
    agentId,
    toolId,
    riskLevel,
    status: 'PENDING',
    approvalToken,
    reason,
    expiresAt,
  });

  await recordAudit({
    actionId,
    eventType: 'APPROVAL_REQUESTED',
    actor: { type: 'AGENT', id: agentId },
    decision: 'APPROVAL_REQUIRED',
    reason: `Action requires human authorization: ${reason}`,
    metadata: { approvalId: approval._id, toolId, riskLevel, expiresAt },
  });

  return approval;
}

async function approveRequest({ approvalId, reviewerId, reason }) {
  const approval = await Approval.findById(approvalId);
  if (!approval) {
    throw new Error('Approval request not found');
  }

  if (approval.status !== 'PENDING') {
    throw new Error(`Cannot approve request with status '${approval.status}'`);
  }

  if (new Date() > approval.expiresAt) {
    approval.status = 'EXPIRED';
    await approval.save();
    throw new Error('Approval request has expired');
  }

  approval.status = 'APPROVED';
  approval.reviewerId = reviewerId;
  approval.reason = reason || 'Approved by security reviewer';
  approval.decidedAt = new Date();
  await approval.save();

  // Find linked ActionRequest
  const actionRequest = await ActionRequest.findById(approval.actionRequestId);
  let executionResult = null;

  if (actionRequest) {
    // Generate authorized execution token and trigger execution
    const executionToken = createExecutionToken(actionRequest.actionId, actionRequest.toolId, actionRequest.agentId);
    try {
      executionResult = await executeAuthorizedTool(
        actionRequest.toolId,
        actionRequest.parameters,
        executionToken
      );
      actionRequest.executionStatus = 'EXECUTED';
      actionRequest.executionResult = executionResult;
    } catch (execErr) {
      actionRequest.executionStatus = 'FAILED';
      actionRequest.executionResult = { error: execErr.message };
    }
    await actionRequest.save();
  }

  await recordAudit({
    actionId: approval.actionId,
    eventType: 'APPROVAL_GRANTED',
    actor: { type: 'USER', id: String(reviewerId) },
    decision: 'ALLOW',
    reason: approval.reason,
    metadata: { approvalId: approval._id, executionResult },
  });

  return { approval, executionResult };
}

async function rejectRequest({ approvalId, reviewerId, reason }) {
  const approval = await Approval.findById(approvalId);
  if (!approval) {
    throw new Error('Approval request not found');
  }

  if (approval.status !== 'PENDING') {
    throw new Error(`Cannot reject request with status '${approval.status}'`);
  }

  approval.status = 'REJECTED';
  approval.reviewerId = reviewerId;
  approval.reason = reason || 'Rejected by security reviewer';
  approval.decidedAt = new Date();
  await approval.save();

  const actionRequest = await ActionRequest.findById(approval.actionRequestId);
  if (actionRequest) {
    actionRequest.executionStatus = 'BLOCKED';
    actionRequest.decisionReason = `Human reviewer rejected action: ${approval.reason}`;
    await actionRequest.save();
  }

  await recordAudit({
    actionId: approval.actionId,
    eventType: 'APPROVAL_DENIED',
    actor: { type: 'USER', id: String(reviewerId) },
    decision: 'BLOCK',
    reason: approval.reason,
    metadata: { approvalId: approval._id },
  });

  return approval;
}

module.exports = {
  createApprovalRequest,
  approveRequest,
  rejectRequest,
};
