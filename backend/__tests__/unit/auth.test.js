const jwt = require('jsonwebtoken');

// Set JWT_SECRET before requiring the module so it picks up our test secret
process.env.JWT_SECRET = 'test-secret';
const { withAuth, signToken } = require('../../src/middleware/auth');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test('returns 401 when Authorization header is missing', () => {
    withAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication failed' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when Authorization header has no Bearer prefix', () => {
    req.headers.authorization = 'Basic some-token';

    withAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is invalid', () => {
    req.headers.authorization = 'Bearer invalid-token';

    withAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is expired', () => {
    const token = jwt.sign({ id: 'u1', username: 'alice' }, 'test-secret', { expiresIn: '-1s' });
    req.headers.authorization = `Bearer ${token}`;

    withAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('attaches user to req and calls next() for valid token', () => {
    const token = signToken({ id: 'u1', username: 'alice' });
    req.headers.authorization = `Bearer ${token}`;

    withAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'u1', username: 'alice' });
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('signToken', () => {
  test('returns a valid JWT with id and username', () => {
    const token = signToken({ id: 'u1', username: 'bob' });
    const decoded = jwt.verify(token, 'test-secret');

    expect(decoded.id).toBe('u1');
    expect(decoded.username).toBe('bob');
  });

  test('token expires in approximately 24 hours', () => {
    const token = signToken({ id: 'u1', username: 'bob' });
    const decoded = jwt.verify(token, 'test-secret');

    const expectedExpiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    // Allow 5 seconds of tolerance
    expect(decoded.exp).toBeGreaterThan(expectedExpiry - 5);
    expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5);
  });
});
