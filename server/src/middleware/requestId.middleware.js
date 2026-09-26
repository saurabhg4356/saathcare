import crypto from 'crypto';

export function requestIdMiddleware(req, res, next) {
  const correlationId = req.headers['x-request-id'] || req.headers['x-correlation-id'] || crypto.randomUUID();
  req.id = correlationId;
  res.setHeader('X-Request-Id', correlationId);
  next();
}
