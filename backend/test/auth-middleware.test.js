import test from 'node:test';
import assert from 'node:assert/strict';
import { requireRole } from '../src/middleware/auth.middleware.js';

test('requireRole allows matching roles through', () => {
  const middleware = requireRole('admin');
  const req = { user: { role: 'admin' } };
  const res = {
    statusCalled: null,
    payload: null,
    status(code) {
      this.statusCalled = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    }
  };

  let nextCalled = false;
  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCalled, null);
});

test('requireRole blocks non-matching roles', () => {
  const middleware = requireRole('admin');
  const req = { user: { role: 'customer' } };
  const res = {
    statusCalled: null,
    payload: null,
    status(code) {
      this.statusCalled = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    }
  };

  let nextCalled = false;
  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCalled, 403);
  assert.equal(res.payload.success, false);
});
