const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRoutes = require('./routes');
const db = require('./db/database');

const app = express();

// Initialize database
db.initDatabase();

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root health check & info route (Render health monitor check)
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'KaryaDesk MSME Agentic AI Backend is live on Render',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    documentation: '/api/v1',
    healthCheck: '/health',
    company: 'Sahyadri Precision Works, Bhosari MIDC, Pune',
    verifiedTargets: {
      reportingPeriod: 'October 2026',
      revenue: '₹47.4L',
      operatingProfit: '₹6.90L',
      profitVariance: '-14.8%',
      rawMaterialSurge: '+18.4%',
      overdueReceivables: '₹4.20L across 3 accounts',
    },
  });
});

// Dedicated health endpoint for Render health checks
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount versioned API routes
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: '/api/v1',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[KaryaDesk Backend Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

module.exports = app;
