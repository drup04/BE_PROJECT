const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { logAuditEvent } = require('../utils/auditLogger');

// List audit events
router.get('/', (req, res) => {
  try {
    let events = db.getAllAuditEvents();
    const { category, result, limit } = req.query;

    if (category) {
      events = events.filter((e) => e.category === category);
    }
    if (result) {
      events = events.filter((e) => e.result === result);
    }
    if (limit) {
      events = events.slice(0, parseInt(limit, 10));
    }

    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Post a new audit event
router.post('/', (req, res) => {
  try {
    const { actor, action, recordReference, category, result, details } = req.body;
    if (!actor || !action || !recordReference || !category || !result) {
      return res.status(400).json({
        success: false,
        error: 'actor, action, recordReference, category, and result are required',
      });
    }

    const event = logAuditEvent(actor, action, recordReference, category, result, details || '');
    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
