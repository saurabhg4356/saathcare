import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import mongoose from 'mongoose';

describe('Phase I: Readiness & Correlation ID Integration Tests', () => {
  it('GET /ready returns 200 and ready state when database is connected', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);

    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ready');
    expect(res.body.data.database).toBe('connected');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /ready returns 503 and not_ready state when database is disconnected', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

    const res = await request(app).get('/ready');
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_READY');
  });

  it('GET /health returns 200 and includes request correlation ID', async () => {
    const customCorrelationId = 'client-req-987654321';
    const res = await request(app)
      .get('/health')
      .set('X-Request-Id', customCorrelationId);

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe(customCorrelationId);
  });
});
