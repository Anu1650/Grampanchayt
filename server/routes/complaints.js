const express = require('express');
const db = require('../db');
const { requireToken } = require('../middleware/csrf');

const router = express.Router();

const VALID_SEVERITIES = ['low', 'med', 'high'];

function nextGrievanceId() {
  const year = new Date().getFullYear();
  const prefix = `DGP-GRV-${year}-`;
  const row = db.prepare(`
    SELECT id FROM complaints
    WHERE id LIKE ?
    ORDER BY id DESC
    LIMIT 1
  `).get(prefix + '%');
  let seq = 1;
  if (row) {
    const parts = row.id.split('-');
    const num = parseInt(parts[3], 10);
    if (!Number.isNaN(num)) seq = num + 1;
  }
  return prefix + String(seq).padStart(6, '0');
}

router.post('/', requireToken, (req, res) => {
  const body = req.body || {};
  const complaint_type = String(body.complaint_type || '').trim();
  const location_ward = String(body.location_ward || '').trim();
  const landmark = String(body.landmark || '').trim();
  const description_en = String(body.description_en || '').trim();
  const description_mr = String(body.description_mr || '').trim();
  const severity = String(body.severity || 'low').trim();
  const photos = Array.isArray(body.photos) ? body.photos : [];
  const complainant_name = String(body.complainant_name || '').trim();
  const complainant_mobile = String(body.complainant_mobile || '').trim();

  if (!complaint_type) {
    return res.status(400).json({ ok: false, error: 'complaint_type is required', code: 'BAD_DATA' });
  }
  if (!description_en || description_en.length < 5) {
    return res.status(400).json({ ok: false, error: 'Description (English) of at least 5 characters is required', code: 'BAD_DATA' });
  }
  if (!complainant_name || complainant_name.length < 2) {
    return res.status(400).json({ ok: false, error: 'Complainant name is required', code: 'BAD_DATA' });
  }
  if (!/^[0-9]{10}$/.test(complainant_mobile)) {
    return res.status(400).json({ ok: false, error: 'A valid 10-digit complainant mobile number is required', code: 'BAD_MOBILE' });
  }
  if (!VALID_SEVERITIES.includes(severity)) {
    return res.status(400).json({ ok: false, error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}`, code: 'BAD_DATA' });
  }
  const id = nextGrievanceId();
  const now = new Date().toISOString();
  const status_history = [{ status: 'submitted', ts: now }];
  const citizen_id = req.session && req.session.citizenId ? req.session.citizenId : null;

  db.prepare(`
    INSERT INTO complaints (
      id, complaint_type, location_ward, landmark, description_en, description_mr,
      severity, photos, complainant_name, complainant_mobile, citizen_id, status,
      status_history, replies, responsible_officer, admin_note, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, '[]', '', '', datetime('now'), datetime('now'))
  `).run(
    id, complaint_type, location_ward || null, landmark || null,
    description_en, description_mr || null, severity, JSON.stringify(photos),
    complainant_name, complainant_mobile, citizen_id, JSON.stringify(status_history)
  );
  const row = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
  return res.status(201).json({
    ok: true,
    data: {
      ...row,
      photos: JSON.parse(row.photos || '[]'),
      status_history: JSON.parse(row.status_history || '[]'),
      replies: JSON.parse(row.replies || '[]'),
    },
    message: 'Complaint registered successfully',
  });
});

router.get('/:id', (req, res) => {
  const id = req.params.id;
  const row = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
  if (!row) {
    return res.status(404).json({ ok: false, error: 'Complaint not found', code: 'NOT_FOUND' });
  }
  return res.json({
    ok: true,
    data: {
      ...row,
      photos: JSON.parse(row.photos || '[]'),
      status_history: JSON.parse(row.status_history || '[]'),
      replies: JSON.parse(row.replies || '[]'),
    },
  });
});

router.post('/:id/track', (req, res) => {
  const id = req.params.id;
  const mobile = String((req.body || {}).mobile || '').trim();
  if (!/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({ ok: false, error: 'A valid 10-digit mobile number is required', code: 'BAD_MOBILE' });
  }
  const row = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
  if (!row) {
    return res.status(404).json({ ok: false, error: 'Complaint not found', code: 'NOT_FOUND' });
  }
  if (row.complainant_mobile !== mobile) {
    return res.status(403).json({ ok: false, error: 'Mobile number does not match complaint', code: 'MOBILE_MISMATCH' });
  }
  return res.json({
    ok: true,
    data: {
      ...row,
      photos: JSON.parse(row.photos || '[]'),
      status_history: JSON.parse(row.status_history || '[]'),
      replies: JSON.parse(row.replies || '[]'),
    },
  });
});

module.exports = router;
