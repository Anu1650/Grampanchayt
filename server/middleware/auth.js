// server/middleware/auth.js - admin session gating
module.exports = function requireAdmin(req, res, next) {
  if (req.session && req.session.userId === 'admin') return next();
  return res.status(401).json({ error: 'Admin authentication required', code: 'NOT_AUTHENTICATED' });
};
