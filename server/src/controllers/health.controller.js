import mongoose from 'mongoose';
import { ApiResponse } from '../utils/apiResponse.js';

const dbStates = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

/**
 * Liveness probe: Confirms application process is alive
 */
export function getLiveness(req, res) {
  return res.status(200).json(
    ApiResponse.success(
      {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
          status: dbStates[mongoose.connection.readyState] || 'unknown',
          host: mongoose.connection.host || 'local'
        }
      },
      'System is healthy'
    )
  );
}

/**
 * Readiness probe: Verifies application dependencies (MongoDB connectivity)
 * Returns 200 when ready to accept traffic, 503 when dependencies are offline
 */
export function getReadiness(req, res) {
  const dbConnected = mongoose.connection.readyState === 1;

  if (!dbConnected) {
    return res.status(503).json(
      ApiResponse.error('Database connection unavailable', 'NOT_READY', {
        status: 'not_ready',
        database: 'disconnected',
        timestamp: new Date().toISOString()
      })
    );
  }

  return res.status(200).json(
    ApiResponse.success(
      {
        status: 'ready',
        database: 'connected',
        host: mongoose.connection.host || 'cluster',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      'System is ready'
    )
  );
}
