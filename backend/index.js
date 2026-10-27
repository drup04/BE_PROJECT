const app = require('./src/app');
const config = require('./src/config');

const PORT = config.port;
const HOST = '0.0.0.0'; // Essential for cloud platforms like Render

const server = app.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log('   KARYADESK AGENTIC AI BACKEND — READY ON RENDER   ');
  console.log('====================================================');
  console.log(` Server running on http://${HOST}:${PORT}`);
  console.log(` Environment : ${config.nodeEnv}`);
  console.log(` Health Check: http://localhost:${PORT}/health`);
  console.log(` API Root    : http://localhost:${PORT}/api/v1`);
  console.log(` Overview    : http://localhost:${PORT}/api/v1/overview`);
  console.log('====================================================');
});

// Graceful shutdown handling for Render container lifecycle
function handleShutdown(signal) {
  console.log(`\nReceived ${signal}. Gracefully closing server...`);
  server.close(() => {
    console.log('HTTP server closed cleanly.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forcefully terminating process after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
