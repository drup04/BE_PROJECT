const express = require('express');
const router = express.Router();
const db = require('../db/database');

// List all customers
router.get('/', (req, res) => {
  try {
    const customers = db.getAllCustomers();
    res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Single customer by id or code
router.get('/:id', (req, res) => {
  try {
    const customer = db.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
