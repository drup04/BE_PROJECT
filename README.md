# KaryaDesk — MSME Agentic AI Platform

An intelligent operations platform tailored for MSMEs, featuring automated quotation management, invoice generation, approval workflows, finance metrics, and AI assistant task routing.

---

## 📁 Repository Structure

```
BE_PROJECT/
├── frontend/               # React + TypeScript + Vite UI dashboard
│   ├── src/                # Component architecture, views, services
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
└── backend/                # Node.js + Express REST API
    ├── src/
    │   ├── routes/         # Approvals, quotations, finance, invoices, AI assistant
    │   ├── db/             # SQLite connection & seed data
    │   └── utils/          # Calculations & audit logging
    ├── tests/              # API test suite
    ├── render.yaml         # Render deployment blueprint
    └── package.json
```

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
npm run seed       # (Optional) Resets and seeds SQLite database
npm run dev        # Starts backend API on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
```

---

## 🛠️ Features & Capabilities
- **Quotation Generator**: Create, validate, and issue GST-compliant quotes.
- **Approval Engine**: Tiered authority limits and maker-checker approval workflows.
- **Audit Trails**: Immutable log of operations and financial approvals.
- **Finance Analytics**: Real-time cash flow and aging receivables tracking.
- **Agentic AI Assistant**: Natural language operations task routing.
