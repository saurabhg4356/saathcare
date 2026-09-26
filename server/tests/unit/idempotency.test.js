import { describe, it, expect, vi, beforeEach } from 'vitest';
import { idempotency } from '../../src/middleware/idempotency.middleware.js';
import { IdempotencyKey } from '../../src/models/IdempotencyKey.js';

describe('Phase G: Idempotency Middleware', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('passes through when no Idempotency-Key is provided on optional route', async () => {
    const middleware = idempotency({ required: false });
    const req = { headers: {} };
    const res = {};
    const next = vi.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('fails with 400 when Idempotency-Key is required but missing', async () => {
    const middleware = idempotency({ required: true });
    const req = { headers: {} };
    const res = {};
    const next = vi.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('Idempotency-Key header is required');
  });

  it('replays previously stored response status and body when duplicate key is received', async () => {
    const middleware = idempotency({ required: false });
    const mockCached = {
      key: 'uuid-1234-abcd',
      userId: '507f1f77bcf86cd799439011',
      responseStatus: 201,
      responseBody: { success: true, data: { expenseId: 'exp-999' } }
    };

    vi.spyOn(IdempotencyKey, 'findOne').mockResolvedValue(mockCached);

    const req = {
      headers: { 'idempotency-key': 'uuid-1234-abcd' },
      user: { _id: '507f1f77bcf86cd799439011' }
    };

    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('X-Cache-Lookup', 'HIT-IDEMPOTENT');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockCached.responseBody);
  });
});
