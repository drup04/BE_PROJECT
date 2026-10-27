const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { calculateReceivablesAging } = require('../utils/calculations');

// List all invoices with optional query filters
router.get('/', (req, res) => {
  try {
    let invoices = db.getAllInvoices();
    const { status, period, customerId } = req.query;

    if (status) {
      invoices = invoices.filter((inv) => inv.status === status);
    }
    if (period) {
      invoices = invoices.filter((inv) => inv.period === period);
    }
    if (customerId) {
      invoices = invoices.filter((inv) => inv.customerId === customerId);
    }

    res.json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Overdue invoices specifically
router.get('/overdue', (req, res) => {
  try {
    const invoices = db.getAllInvoices();
    const overdue = invoices.filter((inv) => inv.status === 'overdue' || inv.daysOverdue > 0);
    const totalOverdue = overdue.reduce((sum, inv) => sum + inv.balanceDue, 0);

    res.json({
      success: true,
      count: overdue.length,
      totalOverdue,
      data: overdue,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Receivables aging breakdown
router.get('/receivables/aging', (req, res) => {
  try {
    const invoices = db.getAllInvoices();
    const aging = calculateReceivablesAging(invoices);

    res.json({
      success: true,
      data: aging,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Single invoice by id or invoiceNumber
router.get('/:id', (req, res) => {
  try {
    const invoice = db.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
