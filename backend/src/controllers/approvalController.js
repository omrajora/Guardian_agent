const Approval = require('../models/Approval');
const { approveRequest, rejectRequest } = require('../services/approval/approvalService');

async function getPendingApprovals(req, res, next) {
  try {
    const pending = await Approval.find({ status: 'PENDING' })
      .populate('actionRequestId')
      .sort({ createdAt: -1 });
    res.json({ count: pending.length, approvals: pending });
  } catch (err) {
    next(err);
  }
}

async function approve(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await approveRequest({
      approvalId: id,
      reviewerId: req.user._id,
      reason,
    });
    res.json({ message: 'Request approved and executed', result });
  } catch (err) {
    res.status(400).json({ error: 'Approval Error', message: err.message });
  }
}

async function reject(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await rejectRequest({
      approvalId: id,
      reviewerId: req.user._id,
      reason,
    });
    res.json({ message: 'Request rejected', result });
  } catch (err) {
    res.status(400).json({ error: 'Rejection Error', message: err.message });
  }
}

module.exports = {
  getPendingApprovals,
  approve,
  reject,
};
