const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { calculateQuotationTotals } = require('../utils/calculations');
const { logAuditEvent } = require('../utils/auditLogger');

// List all quotations
router.get('/', (req, res) => {
  try {
    const quotations = db.getAllQuotations();
    res.json({
      success: true,
      count: quotations.length,
      data: quotations,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculate quote totals (preview)
router.post('/calculate', (req, res) => {
  try {
    const { lines, discountPercent, gstRate } = req.body;
    const totals = calculateQuotationTotals({ lines, discountPercent, gstRate });
    res.json({
      success: true,
      data: totals,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Single quotation by id or quoteNumber
router.get('/:id', (req, res) => {
  try {
    const quote = db.getQuotationById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new quotation
router.post('/', (req, res) => {
  try {
    const {
      customerId,
      customerName,
      createdDate,
      validUntilDate,
      lines,
      discountPercent = 0,
      gstRate = 18,
      notes,
      actor = 'Rajesh Sharma (Owner)',
    } = req.body;

    if (!customerId || !customerName) {
      return res.status(400).json({ success: false, error: 'Customer is required' });
    }

    const calculated = calculateQuotationTotals({ lines, discountPercent, gstRate });

    const quotations = db.getAllQuotations();
    const nextNum = quotations.length + 15;
    const quoteNumber = req.body.quoteNumber || `QT-26-0${nextNum}`;

    const quoteId = `qt-${Date.now()}`;
    const newQuote = {
      id: quoteId,
      quoteNumber,
      customerId,
      customerName,
      createdDate: createdDate || new Date().toISOString().substring(0, 10),
      validUntilDate: validUntilDate || new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
      status: 'draft',
      subtotal: calculated.subtotal,
      discountPercent: calculated.discountPercent,
      discountAmount: calculated.discountAmount,
      gstRate: calculated.gstRate,
      gstAmount: calculated.gstAmount,
      grandTotal: calculated.grandTotal,
      notes: notes || '',
      lines: (lines || []).map((l, idx) => ({
        id: `ql-${Date.now()}-${idx}`,
        productId: l.productId,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        amount: Math.round(l.quantity * l.unitPrice),
      })),
    };

    const saved = db.insertQuotation(newQuote);

    logAuditEvent(
      actor,
      'Quotation Created',
      saved.quoteNumber,
      'sales',
      'success',
      `Created quotation ${saved.quoteNumber} for ${saved.customerName} (₹${saved.grandTotal.toLocaleString('en-IN')})`
    );

    res.status(201).json({
      success: true,
      data: saved,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
