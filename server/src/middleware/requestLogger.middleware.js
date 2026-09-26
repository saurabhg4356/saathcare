import { logger } from '../config/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;
    const requestId = req.id || '-';

    const logPayload = {
      requestId,
      method,
      path: originalUrl,
      status: statusCode,
      durationMs: duration,
      ip
    };

    if (statusCode >= 500) {
      logger.error(`[HTTP] ${method} ${originalUrl} ${statusCode} - ${duration}ms`, null, logPayload);
    } else if (statusCode >= 400) {
      logger.warn(`[HTTP] ${method} ${originalUrl} ${statusCode} - ${duration}ms`, logPayload);
    } else {
      logger.info(`[HTTP] ${method} ${originalUrl} ${statusCode} - ${duration}ms`, logPayload);
    }
  });

  next();
}
