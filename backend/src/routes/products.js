const express = require('express');
const router = express.Router();
const db = require('../db/database');

// List all products
router.get('/', (req, res) => {
  try {
    const products = db.getAllProducts();
    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Margin comparisons between current and previous period
router.get('/margins/comparison', (req, res) => {
  try {
    const products = db.getAllProducts();
    const comparisons = products.map((p) => {
      const change = Math.round((p.currentMarginPercent - p.previousMarginPercent) * 10) / 10;
      return {
        productId: p.id,
        productCode: p.code,
        productName: p.name,
        category: p.category,
        unitPrice: p.unitPrice,
        currentCostPrice: p.currentCostPrice,
        previousCostPrice: p.previousCostPrice,
        previousMarginPercent: p.previousMarginPercent,
        currentMarginPercent: p.currentMarginPercent,
        changePercentagePoints: change,
      };
    });

    res.json({
      success: true,
      data: comparisons,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Single product
router.get('/:id', (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
