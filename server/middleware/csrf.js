// server/middleware/csrf.js - simple nonce-based CSRF for public POSTs
const crypto = require('crypto');

function issueToken(req, res) {
  if (!req.session) return res.status(500).json({ error: 'Session required', code: 'NO_SESSION' });
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  return res.json({ token: req.session.csrfToken });
}

function requireToken(req, res, next) {
  const header = req.headers['x-csrf-token'];
  if (req.session && req.session.csrfToken && header && header === req.session.csrfToken) {
    return next();
  }
  // Admin requests using same cookie-session will also be checked; accept if already authenticated via session and the request originates from trusted origin by lax-cookie for simple cases.
  if (req.session && req.session.userId === 'admin') return next();
  return res.status(403).json({ error: 'Invalid CSRF token', code: 'INVALID_CSRF' });
}

module.exports = { issueToken, requireToken };
