const express = require('express');
const db = require('../db');
const { requireToken } = require('../middleware/csrf');

const router = express.Router();

const SERVICE_CODE_MAP = {
  birth: 'BIR', death: 'DEA', residence: 'RES', income: 'INC',
  water: 'WTR', property_tax: 'PTX',
};

const VALID_SERVICE_TYPES = Object.keys(SERVICE_CODE_MAP);

function nextServiceId(serviceType) {
  const code = SERVICE_CODE_MAP[serviceType];
  if (!code) return null;
  const year = new Date().getFullYear();
  const prefix = `DGP-${code}-${year}-`;
  const row = db.prepare(`
    SELECT id FROM service_applications
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
  const service_type = String(body.service_type || '').trim();
  const applicant_fullname_en = String(body.applicant_fullname_en || '').trim();
  const applicant_fullname_mr = String(body.applicant_fullname_mr || '').trim();
  const mobile = String(body.mobile || '').trim();
  const father_husband_name = String(body.father_husband_name || '').trim();
  const gender = String(body.gender || '').trim();
  const dob = String(body.dob || '').trim();
  const address_en = String(body.address_en || '').trim();
  const address_mr = String(body.address_mr || '').trim();
  const ward_no = body.ward_no ? Number(body.ward_no) : 0;
  const household_no = String(body.household_no || '').trim();
  const aadhaar_last4 = String(body.aadhaar_last4 || '').trim();
  const email = String(body.email || '').trim();
  const service_specific = body.service_specific && typeof body.service_specific === 'object'
    ? body.service_specific : {};
  const documents = Array.isArray(body.documents) ? body.documents : [];

  if (!VALID_SERVICE_TYPES.includes(service_type)) {
    return res.status(400).json({
      ok: false,
      error: `Invalid service_type. Must be one of: ${VALID_SERVICE_TYPES.join(', ')}`,
      code: 'BAD_DATA',
    });
  }
  if (!applicant_fullname_en || applicant_fullname_en.length < 2) {
    return res.status(400).json({ ok: false, error: 'Applicant full name (English) is required', code: 'BAD_DATA' });
  }
  if (!/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({ ok: false, error: 'A valid 10-digit mobile number is required', code: 'BAD_MOBILE' });
  }
  if (aadhaar_last4 && !/^[0-9]{4}$/.test(aadhaar_last4)) {
    return res.status(400).json({ ok: false, error: 'aadhaar_last4 must be 4 digits', code: 'BAD_DATA' });
  }

  const id = nextServiceId(service_type);
  const now = new Date().toISOString();
  const status_history = [{ status: 'submitted', ts: now, note: 'Application received' }];
  const citizen_id = req.session && req.session.citizenId ? req.session.citizenId : null;

  db.prepare(`
    INSERT INTO service_applications (
      id, service_type, applicant_fullname_en, applicant_fullname_mr, mobile,
      father_husband_name, gender, dob, address_en, address_mr, ward_no,
      household_no, aadhaar_last4, email, service_specific, documents, status,
      status_history, admin_note, citizen_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, '', ?, datetime('now'), datetime('now'))
  `).run(
    id, service_type, applicant_fullname_en, applicant_fullname_mr || null, mobile,
    father_husband_name || null, gender || null, dob || null, address_en || null,
    address_mr || null, ward_no, household_no || null, aadhaar_last4 || null,
    email || null, JSON.stringify(service_specific), JSON.stringify(documents),
    JSON.stringify(status_history), citizen_id
  );
  const row = db.prepare('SELECT * FROM service_applications WHERE id = ?').get(id);
  return res.status(201).json({
    ok: true,
    data: {
      ...row,
      service_specific: JSON.parse(row.service_specific || '{}'),
      documents: JSON.parse(row.documents || '[]'),
      status_history: JSON.parse(row.status_history || '[]'),
    },
    message: 'Application submitted successfully',
  });
});

router.post('/track', (req, res) => {
  const body = req.body || {};
  const application_id = String(body.application_id || '').trim();
  const mobile = String(body.mobile || '').trim();
  if (!application_id) {
    return res.status(400).json({ ok: false, error: 'application_id is required', code: 'BAD_DATA' });
  }
  if (!/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({ ok: false, error: 'A valid 10-digit mobile number is required', code: 'BAD_MOBILE' });
  }
  const row = db.prepare('SELECT * FROM service_applications WHERE id = ?').get(application_id);
  if (!row) {
    return res.status(404).json({ ok: false, error: 'Application not found', code: 'NOT_FOUND' });
  }
  if (row.mobile !== mobile) {
    return res.status(403).json({ ok: false, error: 'Mobile number does not match application', code: 'MOBILE_MISMATCH' });
  }
  return res.json({
    ok: true,
    data: {
      ...row,
      service_specific: JSON.parse(row.service_specific || '{}'),
      documents: JSON.parse(row.documents || '[]'),
      status_history: JSON.parse(row.status_history || '[]'),
    },
  });
});

router.get('/:id', (req, res) => {
  const id = req.params.id;
  const row = db.prepare('SELECT * FROM service_applications WHERE id = ?').get(id);
  if (!row) {
    return res.status(404).json({ ok: false, error: 'Application not found', code: 'NOT_FOUND' });
  }
  return res.json({
    ok: true,
    data: {
      ...row,
      service_specific: JSON.parse(row.service_specific || '{}'),
      documents: JSON.parse(row.documents || '[]'),
      status_history: JSON.parse(row.status_history || '[]'),
    },
  });
});

module.exports = router;
