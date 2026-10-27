const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_QUOTATIONS,
  INITIAL_APPROVALS,
  INITIAL_AUDIT_EVENTS,
} = require('./seedData');

let db = null;

function getDbPath() {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }
  const dataDir = path.join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'karyadesk.db');
}

function getDb() {
  if (!db) {
    initDatabase();
  }
  return db;
}

function createSchema(dbInstance) {
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      code TEXT,
      company_name TEXT,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      city TEXT,
      gstin TEXT,
      payment_terms_days INTEGER,
      status TEXT,
      total_orders INTEGER,
      outstanding_balance REAL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      code TEXT,
      name TEXT,
      category TEXT,
      unit TEXT,
      hsn_code TEXT,
      unit_price REAL,
      current_cost_price REAL,
      previous_cost_price REAL,
      current_margin_percent REAL,
      previous_margin_percent REAL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE,
      customer_id TEXT,
      customer_name TEXT,
      invoice_date TEXT,
      due_date TEXT,
      status TEXT,
      subtotal REAL,
      gst_amount REAL,
      total_amount REAL,
      amount_paid REAL,
      balance_due REAL,
      days_overdue INTEGER,
      period TEXT
    );

    CREATE TABLE IF NOT EXISTS invoice_lines (
      id TEXT PRIMARY KEY,
      invoice_id TEXT,
      product_id TEXT,
      description TEXT,
      hsn_code TEXT,
      quantity REAL,
      unit TEXT,
      unit_price REAL,
      amount REAL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      expense_number TEXT UNIQUE,
      category TEXT,
      category_label TEXT,
      description TEXT,
      vendor_name TEXT,
      date TEXT,
      amount REAL,
      period TEXT
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      quote_number TEXT UNIQUE,
      customer_id TEXT,
      customer_name TEXT,
      created_date TEXT,
      valid_until_date TEXT,
      status TEXT,
      subtotal REAL,
      discount_percent REAL,
      discount_amount REAL,
      gst_rate REAL,
      gst_amount REAL,
      grand_total REAL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS quotation_lines (
      id TEXT PRIMARY KEY,
      quotation_id TEXT,
      product_id TEXT,
      description TEXT,
      quantity REAL,
      unit_price REAL,
      amount REAL,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      type TEXT,
      title TEXT,
      rationale TEXT,
      recipient_name TEXT,
      recipient_email TEXT,
      reference_record TEXT,
      amount REAL,
      draft_subject TEXT,
      draft_body TEXT,
      status TEXT,
      created_at TEXT,
      reviewed_at TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      actor TEXT,
      action TEXT,
      record_reference TEXT,
      category TEXT,
      result TEXT,
      details TEXT
    );
  `);
}

function seedDatabase(dbInstance) {
  const customerCount = dbInstance.prepare('SELECT COUNT(*) as cnt FROM customers').get().cnt;
  if (customerCount > 0) {
    return; // Already seeded
  }

  const insertCustomer = dbInstance.prepare(`
    INSERT INTO customers (
      id, code, company_name, contact_person, email, phone, city, gstin,
      payment_terms_days, status, total_orders, outstanding_balance
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertProduct = dbInstance.prepare(`
    INSERT INTO products (
      id, code, name, category, unit, hsn_code, unit_price,
      current_cost_price, previous_cost_price, current_margin_percent, previous_margin_percent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertInvoice = dbInstance.prepare(`
    INSERT INTO invoices (
      id, invoice_number, customer_id, customer_name, invoice_date, due_date,
      status, subtotal, gst_amount, total_amount, amount_paid, balance_due, days_overdue, period
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertInvoiceLine = dbInstance.prepare(`
    INSERT INTO invoice_lines (
      id, invoice_id, product_id, description, hsn_code, quantity, unit, unit_price, amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertExpense = dbInstance.prepare(`
    INSERT INTO expenses (
      id, expense_number, category, category_label, description, vendor_name, date, amount, period
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertQuotation = dbInstance.prepare(`
    INSERT INTO quotations (
      id, quote_number, customer_id, customer_name, created_date, valid_until_date,
      status, subtotal, discount_percent, discount_amount, gst_rate, gst_amount, grand_total, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertQuotationLine = dbInstance.prepare(`
    INSERT INTO quotation_lines (
      id, quotation_id, product_id, description, quantity, unit_price, amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertApproval = dbInstance.prepare(`
    INSERT INTO approvals (
      id, type, title, rationale, recipient_name, recipient_email, reference_record,
      amount, draft_subject, draft_body, status, created_at, reviewed_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAudit = dbInstance.prepare(`
    INSERT INTO audit_events (
      id, timestamp, actor, action, record_reference, category, result, details
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedTransaction = dbInstance.transaction(() => {
    for (const c of INITIAL_CUSTOMERS) {
      insertCustomer.run(
        c.id, c.code, c.companyName, c.contactPerson, c.email, c.phone,
        c.city, c.gstin, c.paymentTermsDays, c.status, c.totalOrders, c.outstandingBalance
      );
    }

    for (const p of INITIAL_PRODUCTS) {
      insertProduct.run(
        p.id, p.code, p.name, p.category, p.unit, p.hsnCode, p.unitPrice,
        p.currentCostPrice, p.previousCostPrice, p.currentMarginPercent, p.previousMarginPercent
      );
    }

    for (const inv of INITIAL_INVOICES) {
      insertInvoice.run(
        inv.id, inv.invoiceNumber, inv.customerId, inv.customerName, inv.invoiceDate,
        inv.dueDate, inv.status, inv.subtotal, inv.gstAmount, inv.totalAmount,
        inv.amountPaid, inv.balanceDue, inv.daysOverdue, inv.period
      );
      if (Array.isArray(inv.lines)) {
        for (const l of inv.lines) {
          insertInvoiceLine.run(
            l.id, inv.id, l.productId, l.description, l.hsnCode || '',
            l.quantity, l.unit || 'pcs', l.unitPrice, l.amount
          );
        }
      }
    }

    for (const exp of INITIAL_EXPENSES) {
      insertExpense.run(
        exp.id, exp.expenseNumber, exp.category, exp.categoryLabel, exp.description,
        exp.vendorName, exp.date, exp.amount, exp.period
      );
    }

    for (const q of INITIAL_QUOTATIONS) {
      insertQuotation.run(
        q.id, q.quoteNumber, q.customerId, q.customerName, q.createdDate,
        q.validUntilDate, q.status, q.subtotal, q.discountPercent, q.discountAmount,
        q.gstRate, q.gstAmount, q.grandTotal, q.notes || ''
      );
      if (Array.isArray(q.lines)) {
        for (const ql of q.lines) {
          insertQuotationLine.run(
            ql.id, q.id, ql.productId, ql.description, ql.quantity, ql.unitPrice, ql.amount
          );
        }
      }
    }

    for (const app of INITIAL_APPROVALS) {
      insertApproval.run(
        app.id, app.type, app.title, app.rationale, app.recipientName, app.recipientEmail,
        app.referenceRecord, app.amount, app.draftSubject, app.draftBody, app.status,
        app.createdAt, app.reviewedAt, app.notes
      );
    }

    for (const aud of INITIAL_AUDIT_EVENTS) {
      insertAudit.run(
        aud.id, aud.timestamp, aud.actor, aud.action, aud.recordReference,
        aud.category, aud.result, aud.details
      );
    }
  });

  seedTransaction();
  console.log('[KaryaDesk DB] Seed data successfully populated into SQLite.');
}

function initDatabase() {
  const dbPath = getDbPath();
  try {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    createSchema(db);
    seedDatabase(db);
    console.log(`[KaryaDesk DB] Connected to SQLite database at: ${dbPath}`);
    return db;
  } catch (err) {
    console.warn(`[KaryaDesk DB] Could not open file database at ${dbPath}:`, err.message);
    console.warn('[KaryaDesk DB] Falling back to in-memory SQLite database.');
    db = new Database(':memory:');
    createSchema(db);
    seedDatabase(db);
    return db;
  }
}

function resetDatabase() {
  const database = getDb();
  const resetTx = database.transaction(() => {
    database.exec(`
      DELETE FROM quotation_lines;
      DELETE FROM quotations;
      DELETE FROM invoice_lines;
      DELETE FROM invoices;
      DELETE FROM expenses;
      DELETE FROM products;
      DELETE FROM customers;
      DELETE FROM approvals;
      DELETE FROM audit_events;
    `);
  });
  resetTx();
  seedDatabase(database);

  // Log reset event
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  database.prepare(`
    INSERT INTO audit_events (
      id, timestamp, actor, action, record_reference, category, result, details
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud-${Date.now()}`,
    now,
    'System Administrator',
    'Demo Workspace Reset',
    'GLOBAL-RESET',
    'system',
    'info',
    'Restored all synthetic seed records, financial ledger, quotation registry, and approval queue to baseline.'
  );

  return true;
}

// Data access helpers with camelCase mapping
function getAllCustomers() {
  const database = getDb();
  const rows = database.prepare('SELECT * FROM customers ORDER BY company_name ASC').all();
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    companyName: r.company_name,
    contactPerson: r.contact_person,
    email: r.email,
    phone: r.phone,
    city: r.city,
    gstin: r.gstin,
    paymentTermsDays: r.payment_terms_days,
    status: r.status,
    totalOrders: r.total_orders,
    outstandingBalance: r.outstanding_balance,
  }));
}

function getCustomerById(id) {
  const database = getDb();
  const r = database.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  if (!r) return null;
  const customer = {
    id: r.id,
    code: r.code,
    companyName: r.company_name,
    contactPerson: r.contact_person,
    email: r.email,
    phone: r.phone,
    city: r.city,
    gstin: r.gstin,
    paymentTermsDays: r.payment_terms_days,
    status: r.status,
    totalOrders: r.total_orders,
    outstandingBalance: r.outstanding_balance,
  };
  customer.invoices = getAllInvoices().filter((inv) => inv.customerId === id);
  customer.quotations = getAllQuotations().filter((q) => q.customerId === id);
  return customer;
}

function getAllProducts() {
  const database = getDb();
  const rows = database.prepare('SELECT * FROM products ORDER BY code ASC').all();
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    category: r.category,
    unit: r.unit,
    hsnCode: r.hsn_code,
    unitPrice: r.unit_price,
    currentCostPrice: r.current_cost_price,
    previousCostPrice: r.previous_cost_price,
    currentMarginPercent: r.current_margin_percent,
    previousMarginPercent: r.previous_margin_percent,
  }));
}

function getProductById(id) {
  const database = getDb();
  const r = database.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!r) return null;
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    category: r.category,
    unit: r.unit,
    hsnCode: r.hsn_code,
    unitPrice: r.unit_price,
    currentCostPrice: r.current_cost_price,
    previousCostPrice: r.previous_cost_price,
    currentMarginPercent: r.current_margin_percent,
    previousMarginPercent: r.previous_margin_percent,
  };
}

function getAllInvoices() {
  const database = getDb();
  const invoices = database.prepare('SELECT * FROM invoices ORDER BY invoice_date DESC').all();
  const lines = database.prepare('SELECT * FROM invoice_lines').all();

  const linesByInvoice = {};
  for (const l of lines) {
    if (!linesByInvoice[l.invoice_id]) linesByInvoice[l.invoice_id] = [];
    linesByInvoice[l.invoice_id].push({
      id: l.id,
      productId: l.product_id,
      description: l.description,
      hsnCode: l.hsn_code,
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unit_price,
      amount: l.amount,
    });
  }

  return invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    customerId: inv.customer_id,
    customerName: inv.customer_name,
    invoiceDate: inv.invoice_date,
    dueDate: inv.due_date,
    status: inv.status,
    subtotal: inv.subtotal,
    gstAmount: inv.gst_amount,
    totalAmount: inv.total_amount,
    amountPaid: inv.amount_paid,
    balanceDue: inv.balance_due,
    daysOverdue: inv.days_overdue,
    period: inv.period,
    lines: linesByInvoice[inv.id] || [],
  }));
}

function getInvoiceById(id) {
  return getAllInvoices().find((inv) => inv.id === id || inv.invoiceNumber === id) || null;
}

function getAllExpenses() {
  const database = getDb();
  const rows = database.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
  return rows.map((e) => ({
    id: e.id,
    expenseNumber: e.expense_number,
    category: e.category,
    categoryLabel: e.category_label,
    description: e.description,
    vendorName: e.vendor_name,
    date: e.date,
    amount: e.amount,
    period: e.period,
  }));
}

function getAllQuotations() {
  const database = getDb();
  const quotations = database.prepare('SELECT * FROM quotations ORDER BY created_date DESC').all();
  const lines = database.prepare('SELECT * FROM quotation_lines').all();

  const linesByQuote = {};
  for (const l of lines) {
    if (!linesByQuote[l.quotation_id]) linesByQuote[l.quotation_id] = [];
    linesByQuote[l.quotation_id].push({
      id: l.id,
      productId: l.product_id,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unit_price,
      amount: l.amount,
    });
  }

  return quotations.map((q) => ({
    id: q.id,
    quoteNumber: q.quote_number,
    customerId: q.customer_id,
    customerName: q.customer_name,
    createdDate: q.created_date,
    validUntilDate: q.valid_until_date,
    status: q.status,
    subtotal: q.subtotal,
    discountPercent: q.discount_percent,
    discountAmount: q.discount_amount,
    gstRate: q.gst_rate,
    gstAmount: q.gst_amount,
    grandTotal: q.grand_total,
    notes: q.notes,
    lines: linesByQuote[q.id] || [],
  }));
}

function getQuotationById(id) {
  return getAllQuotations().find((q) => q.id === id || q.quoteNumber === id) || null;
}

function insertQuotation(quote) {
  const database = getDb();
  const insertQuote = database.prepare(`
    INSERT INTO quotations (
      id, quote_number, customer_id, customer_name, created_date, valid_until_date,
      status, subtotal, discount_percent, discount_amount, gst_rate, gst_amount, grand_total, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLine = database.prepare(`
    INSERT INTO quotation_lines (
      id, quotation_id, product_id, description, quantity, unit_price, amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = database.transaction(() => {
    insertQuote.run(
      quote.id,
      quote.quoteNumber,
      quote.customerId,
      quote.customerName,
      quote.createdDate,
      quote.validUntilDate,
      quote.status,
      quote.subtotal,
      quote.discountPercent,
      quote.discountAmount,
      quote.gstRate,
      quote.gstAmount,
      quote.grandTotal,
      quote.notes || ''
    );

    if (Array.isArray(quote.lines)) {
      for (const line of quote.lines) {
        insertLine.run(
          line.id || `ql-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          quote.id,
          line.productId || '',
          line.description || '',
          line.quantity || 0,
          line.unitPrice || 0,
          line.amount || 0
        );
      }
    }
  });

  tx();
  return getQuotationById(quote.id);
}

function getAllApprovals() {
  const database = getDb();
  const rows = database.prepare('SELECT * FROM approvals ORDER BY created_at DESC').all();
  return rows.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    rationale: a.rationale,
    recipientName: a.recipient_name,
    recipientEmail: a.recipient_email,
    referenceRecord: a.reference_record,
    amount: a.amount,
    draftSubject: a.draft_subject,
    draftBody: a.draft_body,
    status: a.status,
    createdAt: a.created_at,
    reviewedAt: a.reviewed_at,
    notes: a.notes,
  }));
}

function getApprovalById(id) {
  return getAllApprovals().find((a) => a.id === id) || null;
}

function insertApproval(item) {
  const database = getDb();
  database.prepare(`
    INSERT INTO approvals (
      id, type, title, rationale, recipient_name, recipient_email, reference_record,
      amount, draft_subject, draft_body, status, created_at, reviewed_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    item.id,
    item.type,
    item.title,
    item.rationale,
    item.recipientName,
    item.recipientEmail,
    item.referenceRecord,
    item.amount || 0,
    item.draftSubject,
    item.draftBody,
    item.status || 'pending',
    item.createdAt,
    item.reviewedAt || null,
    item.notes || null
  );
  return getApprovalById(item.id);
}

function updateApproval(id, updates) {
  const database = getDb();
  const existing = getApprovalById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };
  database.prepare(`
    UPDATE approvals
    SET draft_subject = ?, draft_body = ?, status = ?, reviewed_at = ?, notes = ?
    WHERE id = ?
  `).run(
    merged.draftSubject,
    merged.draftBody,
    merged.status,
    merged.reviewedAt,
    merged.notes,
    id
  );
  return getApprovalById(id);
}

function getAllAuditEvents() {
  const database = getDb();
  const rows = database.prepare('SELECT * FROM audit_events ORDER BY timestamp DESC').all();
  return rows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    actor: r.actor,
    action: r.action,
    recordReference: r.record_reference,
    category: r.category,
    result: r.result,
    details: r.details,
  }));
}

function insertAuditEvent(event) {
  const database = getDb();
  database.prepare(`
    INSERT INTO audit_events (
      id, timestamp, actor, action, record_reference, category, result, details
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.id,
    event.timestamp,
    event.actor,
    event.action,
    event.recordReference,
    event.category,
    event.result,
    event.details
  );
  return event;
}

module.exports = {
  getDb,
  initDatabase,
  resetDatabase,
  getAllCustomers,
  getCustomerById,
  getAllProducts,
  getProductById,
  getAllInvoices,
  getInvoiceById,
  getAllExpenses,
  getAllQuotations,
  getQuotationById,
  insertQuotation,
  getAllApprovals,
  getApprovalById,
  insertApproval,
  updateApproval,
  getAllAuditEvents,
  insertAuditEvent,
};
