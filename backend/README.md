# KaryaDesk — MSME Agentic AI Backend API
**Deterministic Operations Console for Sahyadri Precision Works, Bhosari MIDC, Pune**

This backend serves the complete, reconciled business operations data of **Sahyadri Precision Works** via a high-performance Express & SQLite REST API. Built specifically for seamless, zero-configuration deployment to **Render**.

---

## Verified Demo Benchmark Targets (100% Mathematically Reconciled)

| Metric | Target Value | Reconciliation Formula |
|---|---|---|
| **Demo Reporting Period** | October 2026 | Baseline: September 2026 |
| **Gross Net Revenue (Oct 2026)** | ₹47,40,000 (`₹47.4L`) | Sum of 8 October sales invoices (`INV-26-1048` to `INV-26-1065`) |
| **Prior Month Revenue (Sep 2026)**| ₹48,00,000 (`₹48.0L`) | Reconciled across 6 September invoices |
| **October Operating Profit** | ₹6,90,000 (`₹6.90L`) | Revenue (₹47.4L) - Total Expenses (₹40.5L) |
| **September Operating Profit** | ₹8,10,000 (`₹8.10L`) | Revenue (₹48.0L) - Total Expenses (₹39.9L) |
| **Operating Profit Variance** | **-14.8%** | `(6,90,000 - 8,10,000) / 8,10,000 = -14.81%` |
| **Raw Material Cost Surge** | **+18.4%** | `(16,80,000 - 14,18,919) / 14,18,919 = +18.40%` |
| **October Operating Margin** | **14.6%** | `6,90,000 / 47,40,000 = 14.56%` |
| **Total Overdue Receivables** | **₹4,20,000** (`₹4.20L`) | 3 accounts: `INV-26-1038` (₹1.85L) + `INV-26-1041` (₹1.45L) + `INV-26-1044` (₹90k) |

---

## Architecture & Render Readiness

1. **Auto-Initializing SQLite Database**: Automatically creates schema and populates all 10 customers, 8 products, 14 invoices, 14 expenses, 6 quotations, approval queue, and audit events on startup.
2. **Resilient Storage Fallback**: If file system write permissions are restricted, automatically runs in-memory SQLite (`:memory:`) ensuring the web service **never** crashes on boot.
3. **Cloud Host Port Binding**: Binds to `0.0.0.0` and listens dynamically on `process.env.PORT` (automatically assigned by Render).
4. **CORS Enabled**: Configured to accept cross-origin requests from any frontend origin (Cloudflare Pages, Vercel, localhost).
5. **Render Health Check Endpoint**: Responds with HTTP 200 on `/health` and `/` for Render's zero-downtime deployment health check.
6. **Graceful Shutdown**: Intercepts `SIGTERM` and `SIGINT` to safely close database connections and active HTTP requests when Render restarts containers.

---

## How to Deploy on Render

### Option 1: Standard Render Web Service (Recommended)

1. **Initialize Git & Push to GitHub**:
   Open a terminal in the `karyadesk-backend` directory:
   ```bash
   cd karyadesk-backend
   git init
   git add .
   git commit -m "feat: initial karyadesk backend for render"
   ```
   Create a new repository on [GitHub](https://github.com/new) (e.g. `karyadesk-backend`), then push:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/karyadesk-backend.git
   git branch -M main
   git push -u origin main
   ```

2. **Create New Web Service on Render**:
   - Log in to your [Render Dashboard](https://dashboard.render.com/).
   - Click **New +** > **Web Service**.
   - Connect your `karyadesk-backend` GitHub repository.

3. **Configure Service Settings**:
   - **Name**: `karyadesk-backend` (or your chosen name)
   - **Region**: Choose closest to your audience (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main`
   - **Root Directory**: Leave blank (if repo root) or `karyadesk-backend` (if in monorepo)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. **Environment Variables** (under *Advanced*):
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: `*` (or your frontend domain)

5. **Health Check Path**:
   - Set **Health Check Path** to: `/health`

6. **Deploy**:
   - Click **Create Web Service**.
   - Render will build the dependencies, launch the server, verify the health check, and provide you with a live URL (e.g., `https://karyadesk-backend.onrender.com`).

---

### Option 2: Render Blueprint (Infrastructure as Code)

This repository includes a pre-configured `render.yaml` file.
1. Push this directory to your GitHub repository.
2. In the Render Dashboard, click **New +** > **Blueprint**.
3. Select the repository. Render will automatically read `render.yaml` and provision the web service with all required settings.

---

## Local Development & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Verification Test Suite
Executes 46 assertions validating all mathematical reconciliations, API endpoints, approval queue gates, and SQLite state changes:
```bash
npm test
```

### 3. Start Local Server
```bash
npm start
```
The server will boot on `http://localhost:5000`:
- **API Root / Documentation**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)
- **Business Overview**: [http://localhost:5000/api/v1/overview](http://localhost:5000/api/v1/overview)

---

## Complete REST API Reference (`/api/v1`)

### 1. Business Overview
- `GET /api/v1/overview` — Aligned 4-measure KPI strip, P&L comparison (Oct vs Sep), overdue accounts, and recent audit events.

### 2. Finance & Ledger
- `GET /api/v1/finance/summary` — Full P&L reconciliation statement (Revenue, Raw Materials, Direct Labor, Factory Overhead, Admin/SG&A, Operating Profit, and variance percentages).
- `GET /api/v1/finance/expenses` — Complete transaction expense ledger.
  - Query params: `?period=current|previous` and `?category=raw_materials|direct_labor|factory_overhead|admin_sales`
- `GET /api/v1/finance/expenses/:id` — Single expense voucher details.

### 3. Customer Directory
- `GET /api/v1/customers` — 10 Pune/Maharashtra OEM component buyers with GSTINs, credit terms, and outstanding balances.
- `GET /api/v1/customers/:id` — Single customer with linked invoice and quotation history.

### 4. Product Catalog & Margins
- `GET /api/v1/products` — 8 precision engineering products with unit prices and unit cost history.
- `GET /api/v1/products/margins/comparison` — Product-by-product margin changes (e.g., Flange Bushing -6.0 percentage points, Valve Shaft -7.5 percentage points).
- `GET /api/v1/products/:id` — Single product details.

### 5. Invoices & Receivables
- `GET /api/v1/invoices` — All 14 sales invoices with line-item breakdowns.
  - Query params: `?status=paid|pending|overdue` and `?period=current|previous`
- `GET /api/v1/invoices/overdue` — Specifically filters the 3 overdue accounts totaling ₹4,20,000.
- `GET /api/v1/invoices/receivables/aging` — Receivables aging brackets (`1-30d`, `31-60d`, `61-90d`, `90d+`).
- `GET /api/v1/invoices/:id` — Single invoice with customer contact and line items.

### 6. Quotation Register
- `GET /api/v1/quotations` — List all registered quotations.
- `GET /api/v1/quotations/:id` — Single quotation with dynamic line items and GST calculations.
- `POST /api/v1/quotations/calculate` — Pure calculation utility (accepts `{ lines, discountPercent, gstRate }`, returns subtotal, discount, taxable amount, 18% GST, and grand total).
- `POST /api/v1/quotations` — Create and save a new quotation. Reconciles totals and logs a sales audit event.

### 7. Human-in-the-Loop Approvals Queue
- `GET /api/v1/approvals` — List proposed sensitive actions (e.g. customer reminder emails).
- `GET /api/v1/approvals/:id` — Single approval item.
- `POST /api/v1/approvals` — Queue new proposed actions.
- `PATCH /api/v1/approvals/:id` — Edit draft subject or body before authorizing.
- `POST /api/v1/approvals/:id/approve` — Explicitly grant human approval (`status: "approved"`).
- `POST /api/v1/approvals/:id/reject` — Reject proposal with audit reason (`status: "rejected"`).
- `POST /api/v1/approvals/:id/simulate-send` — Gated dispatch trigger. **Strictly blocked with HTTP 403 unless approved first!**

### 8. Immutable Audit Trail
- `GET /api/v1/activity` (or `/api/v1/audit`) — Chronological audit log of all system boots, calculations, approvals, rejections, and simulated dispatches.
- `POST /api/v1/audit` — Append custom audit event.

### 9. Operations Assistant (Deterministic AI Agent)
- `POST /api/v1/assistant/intent` — Detect intent and keywords from free-form operational query.
- `POST /api/v1/assistant/query` — Execute signature operational query (*"Why did our profit fall this month?"*). Runs 5-stage sequential verification plan, evaluates unit margins, compiles 5 row-level evidence records, and proposes 3 follow-up drafts for overdue accounts.
- `GET /api/v1/assistant/signature-task` — Quick retrieval of the verified profit analysis run.

### 10. Demo Workspace Reset
- `POST /api/v1/reset` — Restores all SQLite tables back to the pristine baseline state.
