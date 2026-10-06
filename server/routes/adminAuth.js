// server/routes/adminAuth.js - admin login/logout/me
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const requireAdmin = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const password = String((req.body || {}).password || '');
  const username = String((req.body || {}).username || 'admin');
  const row = db.prepare('SELECT * FROM admins WHERE username = ?').get(username)
    || db.prepare('SELECT * FROM admins LIMIT 1').get();
  if (!row) return res.status(401).json({ error: 'No admin configured', code: 'NO_ADMIN' });
  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid password', code: 'INVALID_PASSWORD' });
  req.session.userId = row.username || 'admin';
  req.session.role = row.role || 'admin';
  return res.json({ ok: true, user: { role: row.role || 'admin', username: row.username } });
});

router.post('/logout', (req, res) => {
  req.session = null;
  return res.status(204).end();
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ role: 'admin', username: req.session.userId });
});

module.exports = router;
