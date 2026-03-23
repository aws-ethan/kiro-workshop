const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret';

/**
 * Express middleware that verifies a JWT Bearer token from the Authorization header.
 * On success, attaches { id, username } to req.user and calls next().
 * On failure, returns 401 with { message: "Authentication failed" }.
 */
function withAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = { id: decoded.id, username: decoded.username };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
}

/**
 * Signs a JWT containing the given payload with a 24-hour expiry.
 * @param {{ id: string, username: string }} payload
 * @returns {string} signed JWT
 */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

module.exports = { withAuth, signToken };
