const express = require('express');
const router = express.Router();

const overviewRouter = require('./overview');
const financeRouter = require('./finance');
const customersRouter = require('./customers');
const productsRouter = require('./products');
const invoicesRouter = require('./invoices');
const quotationsRouter = require('./quotations');
const approvalsRouter = require('./approvals');
const auditRouter = require('./audit');
const assistantRouter = require('./assistant');
const resetRouter = require('./reset');

router.use('/overview', overviewRouter);
router.use('/finance', financeRouter);
router.use('/customers', customersRouter);
router.use('/products', productsRouter);
router.use('/invoices', invoicesRouter);
router.use('/quotations', quotationsRouter);
router.use('/approvals', approvalsRouter);
router.use('/activity', auditRouter);
router.use('/audit', auditRouter);
router.use('/assistant', assistantRouter);
router.use('/reset', resetRouter);

// API root summary
router.get('/', (req, res) => {
  res.json({
    service: 'KaryaDesk MSME Agentic AI Backend API',
    version: '1.0.0',
    company: 'Sahyadri Precision Works, Bhosari MIDC, Pune',
    status: 'online',
    endpoints: {
      overview: '/api/v1/overview',
      finance: {
        summary: '/api/v1/finance/summary',
        expenses: '/api/v1/finance/expenses',
      },
      customers: '/api/v1/customers',
      products: {
        list: '/api/v1/products',
        marginComparison: '/api/v1/products/margins/comparison',
      },
      invoices: {
        all: '/api/v1/invoices',
        overdue: '/api/v1/invoices/overdue',
        aging: '/api/v1/invoices/receivables/aging',
      },
      quotations: {
        list: '/api/v1/quotations',
        calculate: 'POST /api/v1/quotations/calculate',
        create: 'POST /api/v1/quotations',
      },
      approvals: {
        list: '/api/v1/approvals',
        propose: 'POST /api/v1/approvals',
        edit: 'PATCH /api/v1/approvals/:id',
        approve: 'POST /api/v1/approvals/:id/approve',
        reject: 'POST /api/v1/approvals/:id/reject',
        simulateSend: 'POST /api/v1/approvals/:id/simulate-send',
      },
      audit: '/api/v1/activity',
      assistant: {
        intent: 'POST /api/v1/assistant/intent',
        query: 'POST /api/v1/assistant/query',
        signatureTask: 'GET /api/v1/assistant/signature-task',
      },
      reset: 'POST /api/v1/reset',
    },
  });
});

module.exports = router;
