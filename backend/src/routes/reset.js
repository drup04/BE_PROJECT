const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.post('/', (req, res) => {
  try {
    db.resetDatabase();
    res.json({
      success: true,
      message: 'Workspace data successfully restored to pristine October 2026 baseline.',
      reconciledTargets: {
        reportingPeriod: 'October 2026',
        grossRevenue: '₹47.4L',
        operatingProfit: '₹6.90L',
        profitVariance: '-14.8%',
        rawMaterialSurge: '+18.4%',
        overdueReceivables: '₹4.20L',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
