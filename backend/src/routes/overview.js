const express = require('express');
const router = express.Router();
const db = require('../db/database');
const {
  calculateFinancialPeriodSummary,
  calculatePercentageChange,
  calculateReceivablesAging,
  formatRupees,
  formatLakhs,
} = require('../utils/calculations');

router.get('/', (req, res) => {
  try {
    const invoices = db.getAllInvoices();
    const expenses = db.getAllExpenses();
    const auditEvents = db.getAllAuditEvents();

    const currentPeriod = calculateFinancialPeriodSummary(invoices, expenses, 'current', 'October 2026');
    const previousPeriod = calculateFinancialPeriodSummary(invoices, expenses, 'previous', 'September 2026');
    const profitChangePercent = calculatePercentageChange(
      currentPeriod.operatingProfit,
      previousPeriod.operatingProfit
    );
    const rawMaterialChangePercent = calculatePercentageChange(
      currentPeriod.rawMaterials,
      previousPeriod.rawMaterials
    );
    const receivablesAging = calculateReceivablesAging(invoices);

    const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue' || inv.daysOverdue > 0);

    const keyMetrics = {
      grossRevenue: {
        raw: currentPeriod.revenue,
        formatted: formatLakhs(currentPeriod.revenue, 1),
        label: 'Gross Net Revenue',
        period: 'October 2026',
      },
      operatingProfit: {
        raw: currentPeriod.operatingProfit,
        formatted: formatLakhs(currentPeriod.operatingProfit, 2),
        label: 'Operating Profit',
        marginPercent: currentPeriod.operatingMarginPercent,
        changePercent: profitChangePercent,
      },
      rawMaterials: {
        raw: currentPeriod.rawMaterials,
        formatted: formatLakhs(currentPeriod.rawMaterials, 1),
        label: 'Raw Materials Consumed',
        changePercent: rawMaterialChangePercent,
      },
      overdueReceivables: {
        raw: receivablesAging.totalOverdue,
        formatted: formatLakhs(receivablesAging.totalOverdue, 2),
        label: 'Overdue Receivables',
        count: receivablesAging.overdueCount,
      },
    };

    res.json({
      success: true,
      data: {
        reportingPeriod: 'October 2026',
        baselinePeriod: 'September 2026',
        keyMetrics,
        currentPeriod,
        previousPeriod,
        profitChangePercent,
        receivablesAging,
        overdueInvoices,
        recentAuditEvents: auditEvents.slice(0, 5),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
