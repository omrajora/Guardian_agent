const ActionRequest = require('../models/ActionRequest');
const Approval = require('../models/Approval');
const AuditLog = require('../models/AuditLog');

async function getOverview(req, res, next) {
  try {
    const [
      totalActions,
      allowedCount,
      blockedCount,
      approvalRequiredCount,
      pendingApprovals,
      piiIncidents,
      secretsBlocked,
    ] = await Promise.all([
      ActionRequest.countDocuments(),
      ActionRequest.countDocuments({ decision: 'ALLOW' }),
      ActionRequest.countDocuments({ decision: 'BLOCK' }),
      ActionRequest.countDocuments({ decision: 'APPROVAL_REQUIRED' }),
      Approval.countDocuments({ status: 'PENDING' }),
      ActionRequest.countDocuments({ 'findings.piiDetected': true }),
      ActionRequest.countDocuments({ 'findings.secretsDetected': true }),
    ]);

    // Risk distribution aggregation
    const riskAggregation = await ActionRequest.aggregate([
      { $group: { _id: '$finalRiskLevel', count: { $sum: 1 } } },
    ]);

    const riskDistribution = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    riskAggregation.forEach((item) => {
      if (item._id && riskDistribution[item._id] !== undefined) {
        riskDistribution[item._id] = item.count;
      }
    });

    // Recent 10 actions
    const recentActions = await ActionRequest.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('actionId agentId toolId action decision finalRiskLevel findings executionStatus createdAt');

    res.json({
      metrics: {
        totalActions,
        allowedCount,
        blockedCount,
        approvalRequiredCount,
        pendingApprovals,
        piiIncidents,
        secretsBlocked,
      },
      riskDistribution,
      recentActions,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOverview,
};
