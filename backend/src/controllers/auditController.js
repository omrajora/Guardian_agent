const { searchAuditLogs } = require('../services/audit/auditService');

async function getAuditLogs(req, res, next) {
  try {
    const { eventType, decision, actorId, limit, page } = req.query;
    const results = await searchAuditLogs({
      eventType,
      decision,
      actorId,
      limit: limit ? parseInt(limit, 10) : 50,
      page: page ? parseInt(page, 10) : 1,
    });
    res.json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAuditLogs,
};
