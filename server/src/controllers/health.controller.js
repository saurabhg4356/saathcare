import mongoose from 'mongoose';
import { ApiResponse } from '../utils/apiResponse.js';

export function getHealth(req, res) {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const healthData = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStates[mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host || 'local'
    },
    system: {
      nodeVersion: process.version,
      memoryUsageMB: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    }
  };

  return res.status(200).json(ApiResponse.success(healthData, 'System is healthy'));
}
