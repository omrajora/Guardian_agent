const AuditLog = require('../../models/AuditLog');
const { redactPayload } = require('../pii/piiScanner');

let ioInstance = null;

function setSocketIO(io) {
  ioInstance = io;
}

async function recordAudit({ actionId, eventType, actor, decision, reason, metadata = {} }) {
  try {
    const sanitizedMetadata = redactPayload(metadata);

    const logEntry = await AuditLog.create({
      actionId,
      eventType,
      actor: {
        type: actor?.type || 'AGENT',
        id: actor?.id || 'unknown',
      },
      decision,
      reason,
      metadata: sanitizedMetadata,
      timestamp: new Date(),
    });

    // Realtime broadcast to connected frontend dashboard
    if (ioInstance) {
      ioInstance.emit('audit:event', logEntry);
      ioInstance.emit('incident:update', {
        actionId,
        eventType,
        decision,
        reason,
        timestamp: logEntry.timestamp,
      });
    }

    return logEntry;
  } catch (err) {
    console.error('[AuditService] Failed to record audit log:', err.message);
    // Audit write failure must not silently fail; log prominently
    return null;
  }
}

async function searchAuditLogs({ eventType, decision, actorId, limit = 50, page = 1 }) {
  const query = {};
  if (eventType) query.eventType = eventType;
  if (decision) query.decision = decision;
  if (actorId) query['actor.id'] = actorId;

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(query),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    logs,
  };
}

module.exports = {
  setSocketIO,
  recordAudit,
  searchAuditLogs,
};
