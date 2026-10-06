// server/routes/public.js - public read endpoints + scheme application submit + track
const express = require('express');
const db = require('../db');
const { requireToken } = require('../middleware/csrf');

const router = express.Router();

router.get('/village', (req, res) => {
  const row = db.prepare('SELECT * FROM village WHERE id = 1').get();
  res.json({ data: row });
});

router.get('/profile-stats', (req, res) => {
  const rows = db.prepare('SELECT * FROM profile_stats ORDER BY display_order ASC').all();
  res.json({ data: rows });
});

router.get('/schemes', (req, res) => {
  const rows = db.prepare('SELECT * FROM schemes ORDER BY id ASC').all();
  res.json({ data: rows });
});

router.get('/notices', (req, res) => {
  const rows = db.prepare('SELECT * FROM notices ORDER BY date_iso DESC').all();
  res.json({ data: rows });
});

router.get('/services', (req, res) => {
  const rows = db.prepare('SELECT * FROM services ORDER BY id ASC').all();
  res.json({ data: rows });
});

router.get('/contacts', (req, res) => {
  const rows = db.prepare('SELECT * FROM contacts ORDER BY is_emergency ASC, id ASC').all();
  res.json({ data: rows });
});

const VALID_STATUSES = ['pending', 'approved', 'rejected'];

router.post('/scheme-applications', requireToken, (req, res) => {
  const body = req.body || {};
  const scheme_id = body.scheme_id ? Number(body.scheme_id) : null;
  const applicant_name_en = (body.applicant_name_en || '').trim();
  const applicant_name_mr = (body.applicant_name_mr || '').trim();
  const mobile = (body.mobile || '').trim();
  const household_no = (body.household_no || '').trim();
  const address_en = (body.address_en || '').trim();
  const address_mr = (body.address_mr || '').trim();
  const notes_en = (body.notes_en || '').trim();
  const notes_mr = (body.notes_mr || '').trim();

  if (!applicant_name_en || applicant_name_en.length < 2) {
    return res.status(400).json({ error: 'Applicant name (English) is required', code: 'BAD_DATA' });
  }
  if (!/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'A valid 10-digit mobile number is required', code: 'BAD_MOBILE' });
  }
  if (scheme_id != null) {
    const exists = db.prepare('SELECT 1 FROM schemes WHERE id = ?').get(scheme_id);
    if (!exists) return res.status(404).json({ error: 'Scheme not found', code: 'SCHEME_NOT_FOUND' });
  }

  const info = db.prepare(`
    INSERT INTO scheme_applications (
      scheme_id, applicant_name_en, applicant_name_mr, mobile, household_no,
      address_en, address_mr, notes_en, notes_mr, status, admin_note, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, datetime('now'), datetime('now'))
  `).run(scheme_id, applicant_name_en, applicant_name_mr || null, mobile, household_no || null,
    address_en || null, address_mr || null, notes_en || null, notes_mr || null);

  res.status(201).json({ id: info.lastInsertRowid, status: 'pending' });
});

router.post('/scheme-applications/track', (req, res) => {
  const mobile = String((req.body || {}).mobile || '').trim();
  const application_id = (req.body || {}).application_id ? Number((req.body || {}).application_id) : null;
  if (!/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Mobile number must be 10 digits', code: 'BAD_MOBILE' });
  }
  let rows;
  if (application_id) {
    rows = db.prepare(`
      SELECT id, scheme_id, applicant_name_en, applicant_name_mr, mobile, household_no,
             status, admin_note, created_at, updated_at
      FROM scheme_applications
      WHERE mobile = ? AND id = ?
      ORDER BY created_at DESC
    `).all(mobile, application_id);
  } else {
    rows = db.prepare(`
      SELECT id, scheme_id, applicant_name_en, applicant_name_mr, mobile, household_no,
             status, admin_note, created_at, updated_at
      FROM scheme_applications
      WHERE mobile = ?
      ORDER BY created_at DESC
    `).all(mobile);
  }
  // Enrich with scheme titles
  const byScheme = new Map();
  rows.forEach(r => { if (r.scheme_id && !byScheme.has(r.scheme_id)) byScheme.set(r.scheme_id, null); });
  if (byScheme.size > 0) {
    const qs = Array.from(byScheme.keys()).map(() => '?').join(',');
    const schemes = db.prepare(`SELECT id, title_en, title_mr FROM schemes WHERE id IN (${qs})`).all(...byScheme.keys());
    schemes.forEach(s => byScheme.set(s.id, { title_en: s.title_en, title_mr: s.title_mr }));
  }
  rows = rows.map(r => ({ ...r, scheme: r.scheme_id ? byScheme.get(r.scheme_id) || null : null }));
  res.json({ data: rows });
});

module.exports = router;
