import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initSocketServer } from './sockets/socketServer.js';
import { startScheduledJobs, stopScheduledJobs } from './jobs/index.js';

const server = http.createServer(app);

// Initialize Socket.io on top of HTTP server
const io = initSocketServer(server);

async function startServer() {
  try {
    // Attempt database connection
    try {
      await connectDatabase();
    } catch (dbErr) {
      logger.warn('Initial MongoDB connection failed. Running in degraded mode until DB is available.', {
        error: dbErr.message
      });
    }

    // Start background scheduled jobs
    startScheduledJobs();

    server.listen(env.PORT, () => {
      logger.info(`SaathCare API & Socket server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`Health check: http://localhost:${env.PORT}/health`);
    });
  } catch (error) {
    logger.error('Fatal error during server startup', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  stopScheduledJobs();

  server.close(async () => {
    logger.info('HTTP & Socket server closed');
    await disconnectDatabase();
    process.exit(0);
  });

  // Force close after 10s timeout
  setTimeout(() => {
    logger.error('Forceful shutdown triggered after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

export { server, io };
