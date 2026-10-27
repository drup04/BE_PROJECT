const express = require('express');
const router = express.Router();
const db = require('../db/database');
const {
  calculateFinancialPeriodSummary,
  calculatePercentageChange,
} = require('../utils/calculations');

// Financial summary (P&L comparison)
router.get('/summary', (req, res) => {
  try {
    const invoices = db.getAllInvoices();
    const expenses = db.getAllExpenses();

    const currentPeriod = calculateFinancialPeriodSummary(invoices, expenses, 'current', 'October 2026');
    const previousPeriod = calculateFinancialPeriodSummary(invoices, expenses, 'previous', 'September 2026');

    const profitVariance = calculatePercentageChange(
      currentPeriod.operatingProfit,
      previousPeriod.operatingProfit
    );
    const revenueVariance = calculatePercentageChange(
      currentPeriod.revenue,
      previousPeriod.revenue
    );
    const rawMaterialsVariance = calculatePercentageChange(
      currentPeriod.rawMaterials,
      previousPeriod.rawMaterials
    );
    const directLaborVariance = calculatePercentageChange(
      currentPeriod.directLabor,
      previousPeriod.directLabor
    );
    const factoryOverheadVariance = calculatePercentageChange(
      currentPeriod.factoryOverhead,
      previousPeriod.factoryOverhead
    );
    const adminSalesVariance = calculatePercentageChange(
      currentPeriod.adminSales,
      previousPeriod.adminSales
    );
    const totalExpensesVariance = calculatePercentageChange(
      currentPeriod.totalExpenses,
      previousPeriod.totalExpenses
    );

    res.json({
      success: true,
      data: {
        currentPeriod,
        previousPeriod,
        variances: {
          revenue: revenueVariance,
          rawMaterials: rawMaterialsVariance,
          directLabor: directLaborVariance,
          factoryOverhead: factoryOverheadVariance,
          adminSales: adminSalesVariance,
          totalExpenses: totalExpensesVariance,
          operatingProfit: profitVariance,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Expenses list with optional filtering
router.get('/expenses', (req, res) => {
  try {
    let expenses = db.getAllExpenses();
    const { period, category } = req.query;

    if (period) {
      expenses = expenses.filter((e) => e.period === period);
    }
    if (category) {
      expenses = expenses.filter((e) => e.category === category);
    }

    res.json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Single expense by id
router.get('/expenses/:id', (req, res) => {
  try {
    const expenses = db.getAllExpenses();
    const expense = expenses.find((e) => e.id === req.params.id || e.expenseNumber === req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense record not found' });
    }

    res.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
