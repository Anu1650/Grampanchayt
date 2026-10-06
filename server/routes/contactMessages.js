const express = require('express');
const db = require('../db');
const { requireToken } = require('../middleware/csrf');

const router = express.Router();

router.post('/', requireToken, (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim();
  const subject = String(body.subject || '').trim();
  const message_en = String(body.message_en || '').trim();
  const message_mr = String(body.message_mr || '').trim();

  if (!name || name.length < 2) {
    return res.status(400).json({ ok: false, error: 'Name is required (at least 2 characters)', code: 'BAD_DATA' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email format', code: 'BAD_EMAIL' });
  }
  if (phone && !/^[0-9+\-\s]{7,15}$/.test(phone)) {
    return res.status(400).json({ ok: false, error: 'Invalid phone format', code: 'BAD_PHONE' });
  }
  if (!message_en || message_en.length < 5) {
    return res.status(400).json({ ok: false, error: 'Message (English) is required (at least 5 characters)', code: 'BAD_DATA' });
  }
  const info = db.prepare(`
    INSERT INTO contact_messages (
      name, email, phone, subject, message_en, message_mr, status, admin_reply, replied_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'new', '', '', datetime('now'))
  `).run(
    name, email || null, phone || null, subject || null,
    message_en, message_mr || null
  );
  const row = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(info.lastInsertRowid);
  return res.status(201).json({
    ok: true,
    data: row,
    message: 'Message submitted successfully. We will get back to you shortly.',
  });
});

module.exports = router;
