const db = require('../db/database');

function logAuditEvent(actor, action, recordReference, category, result, details) {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const event = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: now,
    actor,
    action,
    recordReference,
    category,
    result,
    details,
  };
  return db.insertAuditEvent(event);
}

module.exports = {
  logAuditEvent,
};
