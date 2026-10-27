/**
 * Comprehensive Automated Verification Suite for KaryaDesk Backend
 * Tests all endpoints and mathematical reconciliations.
 */

const http = require('http');
const app = require('../src/app');

let server;
let baseUrl;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let body;
        try {
          body = JSON.parse(data);
        } catch {
          body = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING KARYADESK BACKEND VERIFICATION SUITE ---\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // Start test server on random free port
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
  console.log(`Test server running on ${baseUrl}\n`);

  try {
    // 1. Root & Health
    console.log('[Test 1: Health Check & Root Info]');
    const rootRes = await request('/');
    assert(rootRes.status === 200, 'GET / returns HTTP 200');
    assert(rootRes.body.status === 'healthy', 'GET / returns status "healthy"');
    assert(rootRes.body.verifiedTargets.revenue === '₹47.4L', 'Verified targets contains ₹47.4L revenue');

    const healthRes = await request('/health');
    assert(healthRes.status === 200, 'GET /health returns HTTP 200');
    assert(healthRes.body.status === 'ok', 'GET /health returns status "ok"');

    // 2. Overview Endpoint
    console.log('\n[Test 2: Overview & 4-Measure Metric Reconciliations]');
    const overviewRes = await request('/api/v1/overview');
    assert(overviewRes.status === 200, 'GET /api/v1/overview returns HTTP 200');
    const ov = overviewRes.body.data;
    assert(ov.currentPeriod.revenue === 4740000, 'October revenue is exactly ₹47,40,000');
    assert(ov.currentPeriod.operatingProfit === 690000, 'October operating profit is exactly ₹6,90,000');
    assert(ov.previousPeriod.operatingProfit === 810000, 'September operating profit is exactly ₹8,10,000');
    assert(ov.profitChangePercent === -14.8, 'Profit decline is exactly -14.8%');
    assert(ov.receivablesAging.totalOverdue === 420000, 'Overdue receivables sum to exactly ₹4,20,000');
    assert(ov.receivablesAging.overdueCount === 3, 'Exactly 3 accounts are overdue');

    // 3. Finance & Expenses
    console.log('\n[Test 3: Financial Summary & Transaction Expense Ledger]');
    const financeRes = await request('/api/v1/finance/summary');
    assert(financeRes.status === 200, 'GET /api/v1/finance/summary returns HTTP 200');
    const fin = financeRes.body.data;
    assert(fin.variances.rawMaterials === 18.4, 'Raw material cost surged by exactly +18.4%');
    assert(fin.currentPeriod.operatingMarginPercent === 14.6, 'October operating margin is 14.6%');

    const expRes = await request('/api/v1/finance/expenses?period=current');
    assert(expRes.status === 200, 'GET /api/v1/finance/expenses returns HTTP 200');
    assert(expRes.body.count === 9, 'October has exactly 9 expense records');

    // 4. Customers & Products
    console.log('\n[Test 4: Customers & Products Directories]');
    const custRes = await request('/api/v1/customers');
    assert(custRes.status === 200, 'GET /api/v1/customers returns HTTP 200');
    assert(custRes.body.count === 10, 'Catalog contains 10 Pune/Maharashtra OEM component buyers');

    const prodRes = await request('/api/v1/products');
    assert(prodRes.status === 200, 'GET /api/v1/products returns HTTP 200');
    assert(prodRes.body.count === 8, 'Catalog contains 8 precision engineering products');

    const marginRes = await request('/api/v1/products/margins/comparison');
    assert(marginRes.status === 200, 'GET /api/v1/products/margins/comparison returns HTTP 200');
    const bush = marginRes.body.data.find((p) => p.productCode === 'SPW-FLB-01');
    assert(bush.changePercentagePoints === -6.0, 'Flange Bushing margin contracted by -6.0 percentage points');

    // 5. Invoices & Receivables
    console.log('\n[Test 5: Invoices & Aging Breakdown]');
    const overdueRes = await request('/api/v1/invoices/overdue');
    assert(overdueRes.status === 200, 'GET /api/v1/invoices/overdue returns HTTP 200');
    assert(overdueRes.body.count === 3, 'Exactly 3 overdue invoices returned');
    assert(overdueRes.body.totalOverdue === 420000, 'Overdue total is ₹4,20,000');

    // 6. Quotation Creation & Math
    console.log('\n[Test 6: Quotation Creation & Deterministic GST Calculations]');
    const calcQuoteRes = await request('/api/v1/quotations/calculate', {
      method: 'POST',
      body: {
        lines: [{ quantity: 100, unitPrice: 450 }],
        discountPercent: 10,
        gstRate: 18,
      },
    });
    assert(calcQuoteRes.status === 200, 'POST /api/v1/quotations/calculate returns HTTP 200');
    assert(calcQuoteRes.body.data.subtotal === 45000, 'Subtotal: 100 * 450 = 45,000');
    assert(calcQuoteRes.body.data.discountAmount === 4500, '10% discount = 4,500');
    assert(calcQuoteRes.body.data.taxableAmount === 40500, 'Taxable: 45,000 - 4,500 = 40,500');
    assert(calcQuoteRes.body.data.gstAmount === 7290, '18% GST on 40,500 = 7,290');
    assert(calcQuoteRes.body.data.grandTotal === 47790, 'Grand total = 47,790');

    // 7. Human-in-the-Loop Approval Queue State Machine
    console.log('\n[Test 7: Human Approval Queue Gate & Simulation]');
    const appRes = await request('/api/v1/approvals');
    assert(appRes.status === 200, 'GET /api/v1/approvals returns HTTP 200');
    const firstItem = appRes.body.data[0];

    // Attempt simulation without approval -> MUST FAIL (403)
    const failSimRes = await request(`/api/v1/approvals/${firstItem.id}/simulate-send`, {
      method: 'POST',
    });
    assert(failSimRes.status === 403, 'Simulate send without approval is blocked with HTTP 403');

    // Explicitly approve item
    const approveRes = await request(`/api/v1/approvals/${firstItem.id}/approve`, {
      method: 'POST',
      body: { actor: 'Rajesh Sharma (Owner)' },
    });
    assert(approveRes.status === 200, 'Approval granted successfully (HTTP 200)');
    assert(approveRes.body.data.status === 'approved', 'Item status transitions to "approved"');

    // Now simulate send -> MUST SUCCEED (200)
    const successSimRes = await request(`/api/v1/approvals/${firstItem.id}/simulate-send`, {
      method: 'POST',
      body: { actor: 'Rajesh Sharma (Owner)' },
    });
    assert(successSimRes.status === 200, 'Simulate send succeeds after approval (HTTP 200)');
    assert(successSimRes.body.data.status === 'simulated_sent', 'Item status transitions to "simulated_sent"');

    // 8. AI Operations Assistant Task Run
    console.log('\n[Test 8: AI Operations Assistant Multi-Stage Task Run]');
    const taskRes = await request('/api/v1/assistant/query', {
      method: 'POST',
      body: { prompt: 'Why did our profit fall this month?' },
    });
    assert(taskRes.status === 200, 'POST /api/v1/assistant/query returns HTTP 200');
    const task = taskRes.body.data;
    assert(task.status === 'completed', 'Task status is "completed"');
    assert(task.steps.length === 5, 'Executed 5-stage sequential verification plan');
    assert(task.summary.profitChangePercent === -14.8, 'Summary verifies -14.8% profit decline');
    assert(task.summary.evidenceRecords.length === 5, 'Extracted 5 row-level evidence records');
    assert(task.proposedAction.drafts.length === 3, 'Generated 3 follow-up reminder drafts');

    // 9. Reset Baseline Mechanism
    console.log('\n[Test 9: Database Reset & Restore Baseline]');
    const resetRes = await request('/api/v1/reset', { method: 'POST' });
    assert(resetRes.status === 200, 'POST /api/v1/reset returns HTTP 200');
    assert(resetRes.body.success === true, 'Database reset confirmed');

    console.log(`\n========================================`);
    console.log(` ALL TESTS PASSED: ${passed}/${total} assertions`);
    console.log(`========================================\n`);
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\nTests failed with error:', err);
  if (server) server.close();
  process.exit(1);
});
