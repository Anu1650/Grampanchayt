const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const requireCitizen = require('../middleware/citizenAuth');
const { requireToken } = require('../middleware/csrf');

const router = express.Router();

router.post('/register', requireToken, (req, res) => {
  const body = req.body || {};
  const mobile = String(body.mobile || '').trim();
  const password = String(body.password || '');
  const fullname_en = String(body.fullname_en || '').trim();
  const fullname_mr = String(body.fullname_mr || '').trim();
  const ward_no = body.ward_no ? Number(body.ward_no) : 1;
  const household_no = String(body.household_no || '').trim();
  const gender = String(body.gender || '').trim();
  const dob = String(body.dob || '').trim();
  const email = String(body.email || '').trim();
  const address_en = String(body.address_en || '').trim();
  const address_mr = String(body.address_mr || '').trim();
  const aadhaar_last4 = String(body.aadhaar_last4 || '').trim();
  const father_husband_name = String(body.father_husband_name || '').trim();

  if (!/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({ ok: false, error: 'A valid 10-digit mobile number is required', code: 'BAD_MOBILE' });
  }
  if (password.length < 6) {
    return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters', code: 'BAD_PASSWORD' });
  }
  if (!fullname_en || fullname_en.length < 2) {
    return res.status(400).json({ ok: false, error: 'Full name (English) is required', code: 'BAD_DATA' });
  }
  const existing = db.prepare('SELECT id FROM citizens WHERE mobile = ?').get(mobile);
  if (existing) {
    return res.status(409).json({ ok: false, error: 'Mobile number already registered', code: 'MOBILE_EXISTS' });
  }
  const password_hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`
    INSERT INTO citizens (
      mobile, password_hash, fullname_en, fullname_mr, ward_no, household_no,
      gender, dob, email, address_en, address_mr, aadhaar_last4, father_husband_name,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    mobile, password_hash, fullname_en, fullname_mr || null, ward_no, household_no || null,
    gender || null, dob || null, email || null, address_en || null, address_mr || null,
    aadhaar_last4 || null, father_husband_name || null
  );
  const citizen_id = info.lastInsertRowid;
  req.session.citizenId = citizen_id;
  req.session.citizenMobile = mobile;
  return res.status(201).json({ ok: true, citizen_id });
});

router.post('/login', (req, res) => {
  const body = req.body || {};
  const mobile = String(body.mobile || '').trim();
  const password = String(body.password || '');
  if (!/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({ ok: false, error: 'A valid 10-digit mobile number is required', code: 'BAD_MOBILE' });
  }
  const row = db.prepare('SELECT * FROM citizens WHERE mobile = ?').get(mobile);
  if (!row) {
    return res.status(401).json({ ok: false, error: 'Mobile not registered', code: 'INVALID_CREDENTIALS' });
  }
  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) {
    return res.status(401).json({ ok: false, error: 'Invalid password', code: 'INVALID_CREDENTIALS' });
  }
  req.session.citizenId = row.id;
  req.session.citizenMobile = row.mobile;
  const { password_hash, ...user } = row;
  return res.json({ ok: true, user });
});

router.post('/logout', (req, res) => {
  req.session = null;
  return res.status(204).end();
});

router.get('/me', requireCitizen, (req, res) => {
  const row = db.prepare('SELECT * FROM citizens WHERE id = ?').get(req.session.citizenId);
  if (!row) {
    return res.status(404).json({ ok: false, error: 'Citizen profile not found', code: 'NOT_FOUND' });
  }
  const { password_hash, ...profile } = row;
  return res.json({ ok: true, data: profile });
});

module.exports = router;
