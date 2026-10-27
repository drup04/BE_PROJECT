const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { logAuditEvent } = require('../utils/auditLogger');

// List all approval items
router.get('/', (req, res) => {
  try {
    const items = db.getAllApprovals();
    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Single approval item
router.get('/:id', (req, res) => {
  try {
    const item = db.getApprovalById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Approval item not found' });
    }
    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add proposed approval items (e.g. from assistant batch)
router.post('/', (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items array is required' });
    }

    const created = [];
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const newItem = {
        id: `appr-${Date.now()}-${i}`,
        type: it.type || 'customer_email',
        title: it.title,
        rationale: it.rationale,
        recipientName: it.recipientName,
        recipientEmail: it.recipientEmail,
        referenceRecord: it.referenceRecord,
        amount: it.amount || 0,
        draftSubject: it.draftSubject,
        draftBody: it.draftBody,
        status: 'pending',
        createdAt: now,
      };
      const saved = db.insertApproval(newItem);
      created.push(saved);

      logAuditEvent(
        'AI Operations Assistant',
        'Action Proposed to Human Queue',
        saved.referenceRecord,
        'approval',
        'info',
        `Queued sensitive proposal for review: "${saved.title}" (${saved.recipientName})`
      );
    }

    res.status(201).json({
      success: true,
      count: created.length,
      data: created,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Edit draft content
router.patch('/:id', (req, res) => {
  try {
    const { draftSubject, draftBody, notes, actor = 'Human Reviewer' } = req.body;
    const existing = db.getApprovalById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Approval item not found' });
    }

    const updated = db.updateApproval(req.params.id, {
      draftSubject: draftSubject !== undefined ? draftSubject : existing.draftSubject,
      draftBody: draftBody !== undefined ? draftBody : existing.draftBody,
      notes: notes !== undefined ? notes : existing.notes,
    });

    logAuditEvent(
      actor,
      'Draft Action Content Edited',
      updated.referenceRecord,
      'approval',
      'info',
      `User modified draft text for "${updated.title}"`
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Grant human approval
router.post('/:id/approve', (req, res) => {
  try {
    const { actor = 'Rajesh Sharma (Owner)' } = req.body;
    const item = db.getApprovalById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Approval item not found' });
    }

    if (item.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot approve item with current status "${item.status}"`,
        data: item,
      });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = db.updateApproval(req.params.id, {
      status: 'approved',
      reviewedAt: now,
    });

    logAuditEvent(
      actor,
      'Human Approval Granted',
      updated.referenceRecord,
      'approval',
      'success',
      `Explicit approval given for: "${updated.title}". Ready for simulated dispatch.`
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject proposed action with reason
router.post('/:id/reject', (req, res) => {
  try {
    const { reason = 'No reason provided', actor = 'Rajesh Sharma (Owner)' } = req.body;
    const item = db.getApprovalById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Approval item not found' });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = db.updateApproval(req.params.id, {
      status: 'rejected',
      reviewedAt: now,
      notes: reason,
    });

    logAuditEvent(
      actor,
      'Human Action Rejected',
      updated.referenceRecord,
      'approval',
      'rejected',
      `Proposal rejected by reviewer: "${updated.title}". Reason: ${reason}`
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Gated simulated send (strictly requires approved status)
router.post('/:id/simulate-send', (req, res) => {
  try {
    const { actor = 'Rajesh Sharma (Owner)' } = req.body;
    const item = db.getApprovalById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Approval item not found' });
    }

    if (item.status !== 'approved') {
      return res.status(403).json({
        success: false,
        error: `Cannot simulate send: item status is "${item.status}". Explicit human approval is required first.`,
      });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = db.updateApproval(req.params.id, {
      status: 'simulated_sent',
      reviewedAt: now,
    });

    logAuditEvent(
      actor,
      'Simulated Email Dispatch Completed',
      updated.referenceRecord,
      'simulation',
      'success',
      `Simulated customer transmission to ${updated.recipientEmail} (${updated.recipientName}). No live email was dispatched.`
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
