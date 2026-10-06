// server/routes/admin.js - CRUD for all entities + scheme application management
const express = require('express');
const db = require('../db');
const requireAdmin = require('../middleware/auth');
const { requireToken } = require('../middleware/csrf');

const router = express.Router();
router.use(requireAdmin, requireToken);

// ---------- Village ----------
router.put('/village', (req, res) => {
  const b = req.body || {};
  const fields = ['name_en','name_mr','lgd_gp','lgd_village','address_en','address_mr','office_timings_en','office_timings_mr'];
  const numeric = ['lat','lon','area_sqkm','total_population','total_hhs'];
  const values = {};
  fields.forEach(f => { if (typeof b[f] === 'string') values[f] = b[f]; });
  numeric.forEach(f => { if (b[f] != null) { const n = Number(b[f]); if (!Number.isNaN(n)) values[f] = n; } });
  values.updated_at = new Date().toISOString();
  const sets = Object.keys(values).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE village SET ${sets} WHERE id = 1`).run(values);
  const row = db.prepare('SELECT * FROM village WHERE id = 1').get();
  res.json({ ok: true, data: row });
});

// ---------- Profile Stats ----------
router.put('/profile-stats/:id', (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const numeric = ['male','female','total','full_width','display_order'];
  const textFields = ['icon','heading_en','heading_mr',
    'stat1_label_en','stat1_label_mr','stat1_value',
    'stat2_label_en','stat2_label_mr','stat2_value',
    'stat3_label_en','stat3_label_mr','stat3_value','special'];
  const values = {};
  textFields.forEach(f => { if (typeof b[f] === 'string') values[f] = b[f]; });
  numeric.forEach(f => { if (b[f] != null) { const n = Number(b[f]); if (!Number.isNaN(n)) values[f] = n; } });
  if (Object.keys(values).length === 0) {
    return res.status(400).json({ ok: false, error: 'No updatable fields provided', code: 'BAD_DATA' });
  }
  const sets = Object.keys(values).map(k => `${k} = @${k}`).join(', ');
  const info = db.prepare(`UPDATE profile_stats SET ${sets} WHERE id = @id`).run({ ...values, id });
  if (info.changes === 0) return res.status(404).json({ ok: false, error: 'Profile stat not found', code: 'NOT_FOUND' });
  res.json({ ok: true, data: db.prepare('SELECT * FROM profile_stats WHERE id = ?').get(id) });
});

// ---------- Generic CRUD helpers ----------
function makeCrud(table, requiredFields, textFields, numericFields = []) {
  const baseRoute = table.replace(/_/g, '-');
  router.get(`/${baseRoute}`, (req, res) => {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY id ASC`).all();
    res.json({ ok: true, data: rows });
  });
  router.post(`/${baseRoute}`, (req, res) => {
    const b = req.body || {};
    for (const f of requiredFields) {
      if (b[f] == null || String(b[f]).trim() === '') return res.status(400).json({ ok: false, error: `Field '${f}' is required`, code: 'BAD_DATA' });
    }
    const values = {};
    textFields.forEach(f => { if (typeof b[f] === 'string') values[f] = b[f]; });
    numericFields.forEach(f => { if (b[f] != null) { const n = Number(b[f]); if (!Number.isNaN(n)) values[f] = n; } });
    const cols = Object.keys(values);
    const placeholders = cols.map(c => `@${c}`).join(', ');
    const colsStr = cols.join(', ');
    const info = db.prepare(`INSERT INTO ${table} (${colsStr}) VALUES (${placeholders})`).run(values);
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid);
    res.status(201).json({ ok: true, data: row });
  });
  router.put(`/${baseRoute}/:id`, (req, res) => {
    const id = Number(req.params.id);
    const b = req.body || {};
    const values = {};
    textFields.forEach(f => { if (typeof b[f] === 'string') values[f] = b[f]; });
    numericFields.forEach(f => { if (b[f] != null) { const n = Number(b[f]); if (!Number.isNaN(n)) values[f] = n; } });
    if (Object.keys(values).length === 0) return res.status(400).json({ ok: false, error: 'Nothing to update', code: 'BAD_DATA' });
    const sets = Object.keys(values).map(k => `${k} = @${k}`).join(', ');
    const info = db.prepare(`UPDATE ${table} SET ${sets} WHERE id = @id`).run({ ...values, id });
    if (info.changes === 0) return res.status(404).json({ ok: false, error: `${baseRoute} not found`, code: 'NOT_FOUND' });
    res.json({ ok: true, data: db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) });
  });
  router.delete(`/${baseRoute}/:id`, (req, res) => {
    const id = Number(req.params.id);
    const info = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    if (info.changes === 0) return res.status(404).json({ ok: false, error: `${baseRoute} not found`, code: 'NOT_FOUND' });
    res.status(204).end();
  });
}

makeCrud('schemes',
  ['title_en','title_mr','desc_en','desc_mr'],
  ['title_en','title_mr','desc_en','desc_mr','tags_en','tags_mr','icon','accent',
   'eligibility_en','eligibility_mr','application_process_en','application_process_mr',
   'benefits_en','benefits_mr','documents_required_en','documents_required_mr','scheme_code'],
);
makeCrud('notices',
  ['date_iso','title_en','title_mr','desc_en','desc_mr'],
  ['date_iso','month_en','month_mr','day','title_en','title_mr','desc_en','desc_mr',
   'badge_en','badge_mr','badge_color','notice_type','pdf_attachment','download_filename'],
);
makeCrud('services',
  ['title_en','title_mr','desc_en','desc_mr'],
  ['title_en','title_mr','desc_en','desc_mr','icon'],
);
makeCrud('contacts',
  ['person_name','role_en','role_mr','mobile'],
  ['person_name','role_en','role_mr','mobile','email','extra_label_en','extra_label_mr','extra_value','accent'],
  ['is_emergency'],
);
makeCrud('panchayat_members',
  ['name_en','name_mr','role_en','role_mr','mobile'],
  ['name_en','name_mr','role_en','role_mr','mobile','email','photo','term_start','term_end','party_name'],
  ['ward_no'],
);
makeCrud('projects',
  ['title_en','title_mr'],
  ['title_en','title_mr','category_en','category_mr','status','start_date','end_date',
   'contractor_name','funding_source_en','funding_source_mr','description_en','description_mr','photos'],
  ['progress_percent','cost_total','cost_spent'],
);
makeCrud('gram_sabha_meetings',
  ['meeting_date','meeting_time','venue_en','chairperson_en'],
  ['meeting_date','meeting_time','venue_en','venue_mr','chairperson_en','chairperson_mr',
   'agenda_pdf','minutes_en','minutes_mr','minutes_pdf','status'],
  ['attendance_count'],
);

// ---------- Scheme Applications (admin) ----------
router.get('/scheme-applications', (req, res) => {
  const status = typeof req.query.status === 'string' && ['pending','approved','rejected'].includes(req.query.status) ? req.query.status : null;
  const q = typeof req.query.q === 'string' ? `%${req.query.q}%` : null;
  let where = [];
  const params = [];
  if (status) { where.push('sa.status = ?'); params.push(status); }
  if (q) { where.push('(sa.applicant_name_en LIKE ? OR sa.applicant_name_mr LIKE ? OR sa.mobile LIKE ? OR sa.household_no LIKE ?)'); params.push(q, q, q, q); }
  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = db.prepare(`
    SELECT sa.*, s.title_en AS scheme_title_en, s.title_mr AS scheme_title_mr
    FROM scheme_applications sa
    LEFT JOIN schemes s ON s.id = sa.scheme_id
    ${whereStr}
    ORDER BY sa.created_at DESC
    LIMIT 500
  `).all(...params);
  res.json({ ok: true, data: rows });
});

router.patch('/scheme-applications/:id', (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const values = {};
  if (b.status && ['pending','approved','rejected'].includes(b.status)) values.status = b.status;
  if (typeof b.admin_note === 'string') values.admin_note = b.admin_note;
  if (Object.keys(values).length === 0) return res.status(400).json({ ok: false, error: 'Nothing to update', code: 'BAD_DATA' });
  values.updated_at = new Date().toISOString();
  const sets = Object.keys(values).map(k => `${k} = @${k}`).join(', ');
  const info = db.prepare(`UPDATE scheme_applications SET ${sets} WHERE id = @id`).run({ ...values, id });
  if (info.changes === 0) return res.status(404).json({ ok: false, error: 'Application not found', code: 'NOT_FOUND' });
  res.json({ ok: true, data: db.prepare('SELECT * FROM scheme_applications WHERE id = ?').get(id) });
});

// ---------- Service Applications (admin) ----------
router.get('/service-applications', (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : null;
  const service_type = typeof req.query.service_type === 'string' ? req.query.service_type : null;
  const q = typeof req.query.q === 'string' ? `%${req.query.q}%` : null;
  let where = [];
  const params = [];
  if (status) { where.push('status = ?'); params.push(status); }
  if (service_type) { where.push('service_type = ?'); params.push(service_type); }
  if (q) { where.push('(applicant_fullname_en LIKE ? OR applicant_fullname_mr LIKE ? OR mobile LIKE ? OR id LIKE ?)'); params.push(q, q, q, q); }
  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = db.prepare(`
    SELECT * FROM service_applications
    ${whereStr}
    ORDER BY created_at DESC
    LIMIT 500
  `).all(...params);
  const enriched = rows.map(r => ({
    ...r,
    service_specific: r.service_specific ? JSON.parse(r.service_specific) : {},
    documents: r.documents ? JSON.parse(r.documents) : [],
    status_history: r.status_history ? JSON.parse(r.status_history) : [],
  }));
  res.json({ ok: true, data: enriched });
});

router.patch('/service-applications/:id', (req, res) => {
  const id = req.params.id;
  const b = req.body || {};
  const existing = db.prepare('SELECT * FROM service_applications WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ ok: false, error: 'Service application not found', code: 'NOT_FOUND' });
  const new_status = typeof b.status === 'string' && b.status.trim() ? b.status.trim() : null;
  const admin_note = typeof b.admin_note === 'string' ? b.admin_note : null;
  if (!new_status && admin_note === null) {
    return res.status(400).json({ ok: false, error: 'At least status or admin_note is required', code: 'BAD_DATA' });
  }
  const history = existing.status_history ? JSON.parse(existing.status_history) : [];
  const now = new Date().toISOString();
  if (new_status) {
    history.push({ status: new_status, ts: now, note: admin_note || 'Status updated by admin' });
  } else if (admin_note) {
    history.push({ status: existing.status, ts: now, note: admin_note });
  }
  const values = {};
  if (new_status) values.status = new_status;
  if (admin_note !== null) values.admin_note = admin_note;
  values.status_history = JSON.stringify(history);
  values.updated_at = now;
  const sets = Object.keys(values).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE service_applications SET ${sets} WHERE id = @id`).run({ ...values, id });
  const row = db.prepare('SELECT * FROM service_applications WHERE id = ?').get(id);
  res.json({
    ok: true,
    data: {
      ...row,
      service_specific: row.service_specific ? JSON.parse(row.service_specific) : {},
      documents: row.documents ? JSON.parse(row.documents) : [],
      status_history: JSON.parse(row.status_history || '[]'),
    },
  });
});

// ---------- Complaints (admin) ----------
router.get('/complaints', (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : null;
  const type = typeof req.query.type === 'string' ? req.query.type : null;
  const ward = typeof req.query.ward === 'string' ? req.query.ward : null;
  let where = [];
  const params = [];
  if (status) { where.push('status = ?'); params.push(status); }
  if (type) { where.push('complaint_type = ?'); params.push(type); }
  if (ward) { where.push('location_ward = ?'); params.push(ward); }
  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = db.prepare(`
    SELECT * FROM complaints
    ${whereStr}
    ORDER BY created_at DESC
    LIMIT 500
  `).all(...params);
  const enriched = rows.map(r => ({
    ...r,
    photos: r.photos ? JSON.parse(r.photos) : [],
    status_history: r.status_history ? JSON.parse(r.status_history) : [],
    replies: r.replies ? JSON.parse(r.replies) : [],
  }));
  res.json({ ok: true, data: enriched });
});

router.patch('/complaints/:id', (req, res) => {
  const id = req.params.id;
  const b = req.body || {};
  const existing = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ ok: false, error: 'Complaint not found', code: 'NOT_FOUND' });
  const new_status = typeof b.status === 'string' && b.status.trim() ? b.status.trim() : null;
  const admin_reply_text = typeof b.admin_reply_text === 'string' && b.admin_reply_text.trim() ? b.admin_reply_text.trim() : null;
  const admin_reply_photo = typeof b.admin_reply_photo === 'string' ? b.admin_reply_photo : null;
  const responsible_officer = typeof b.responsible_officer === 'string' ? b.responsible_officer : null;
  const admin_note = typeof b.admin_note === 'string' ? b.admin_note : null;
  if (!new_status && !admin_reply_text && responsible_officer === null && admin_note === null) {
    return res.status(400).json({ ok: false, error: 'Nothing to update', code: 'BAD_DATA' });
  }
  const now = new Date().toISOString();
  const status_history = existing.status_history ? JSON.parse(existing.status_history) : [];
  const replies = existing.replies ? JSON.parse(existing.replies) : [];
  if (new_status) {
    status_history.push({ status: new_status, ts: now });
  }
  if (admin_reply_text) {
    replies.push({
      by: 'admin',
      ts: now,
      text: admin_reply_text,
      photo: admin_reply_photo || '',
    });
  }
  const values = {};
  if (new_status) values.status = new_status;
  values.status_history = JSON.stringify(status_history);
  values.replies = JSON.stringify(replies);
  if (responsible_officer !== null) values.responsible_officer = responsible_officer;
  if (admin_note !== null) values.admin_note = admin_note;
  values.updated_at = now;
  const sets = Object.keys(values).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE complaints SET ${sets} WHERE id = @id`).run({ ...values, id });
  const row = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
  res.json({
    ok: true,
    data: {
      ...row,
      photos: row.photos ? JSON.parse(row.photos) : [],
      status_history: JSON.parse(row.status_history || '[]'),
      replies: JSON.parse(row.replies || '[]'),
    },
  });
});

// ---------- Contact Messages (admin) ----------
router.get('/contact-messages', (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : null;
  let where = [];
  const params = [];
  if (status) { where.push('status = ?'); params.push(status); }
  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = db.prepare(`
    SELECT * FROM contact_messages
    ${whereStr}
    ORDER BY created_at DESC
    LIMIT 500
  `).all(...params);
  res.json({ ok: true, data: rows });
});

router.patch('/contact-messages/:id/reply', (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const admin_reply = typeof b.admin_reply === 'string' ? b.admin_reply.trim() : '';
  if (!admin_reply) {
    return res.status(400).json({ ok: false, error: 'admin_reply text is required', code: 'BAD_DATA' });
  }
  const now = new Date().toISOString();
  const info = db.prepare(`
    UPDATE contact_messages
    SET status = 'replied', admin_reply = ?, replied_at = ?
    WHERE id = ?
  `).run(admin_reply, now, id);
  if (info.changes === 0) return res.status(404).json({ ok: false, error: 'Contact message not found', code: 'NOT_FOUND' });
  res.json({ ok: true, data: db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id), message: 'Reply sent successfully' });
});

// ---------- Gram Sabha Agenda & Attendance (admin) ----------
router.post('/gramsabha/:id/agenda', (req, res) => {
  const meeting_id = Number(req.params.id);
  const meeting = db.prepare('SELECT 1 FROM gram_sabha_meetings WHERE id = ?').get(meeting_id);
  if (!meeting) return res.status(404).json({ ok: false, error: 'Gram Sabha meeting not found', code: 'NOT_FOUND' });
  const b = req.body || {};
  const item_no = b.item_no ? Number(b.item_no) : 1;
  const title_en = String(b.title_en || '').trim();
  const title_mr = String(b.title_mr || '').trim();
  const description_en = String(b.description_en || '').trim();
  const description_mr = String(b.description_mr || '').trim();
  const decision_en = String(b.decision_en || '').trim();
  const decision_mr = String(b.decision_mr || '').trim();
  if (!title_en) return res.status(400).json({ ok: false, error: 'title_en is required', code: 'BAD_DATA' });
  const info = db.prepare(`
    INSERT INTO gram_sabha_agenda (
      meeting_id, item_no, title_en, title_mr, description_en, description_mr,
      decision_en, decision_mr, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(meeting_id, item_no, title_en, title_mr || null, description_en || null,
        description_mr || null, decision_en || null, decision_mr || null);
  const row = db.prepare('SELECT * FROM gram_sabha_agenda WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ok: true, data: row });
});

router.put('/gramsabha/agenda/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT 1 FROM gram_sabha_agenda WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ ok: false, error: 'Agenda item not found', code: 'NOT_FOUND' });
  const b = req.body || {};
  const values = {};
  const textFields = ['title_en','title_mr','description_en','description_mr','decision_en','decision_mr'];
  textFields.forEach(f => { if (typeof b[f] === 'string') values[f] = b[f]; });
  if (b.item_no != null) { const n = Number(b.item_no); if (!Number.isNaN(n)) values.item_no = n; }
  if (Object.keys(values).length === 0) return res.status(400).json({ ok: false, error: 'Nothing to update', code: 'BAD_DATA' });
  const sets = Object.keys(values).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE gram_sabha_agenda SET ${sets} WHERE id = @id`).run({ ...values, id });
  res.json({ ok: true, data: db.prepare('SELECT * FROM gram_sabha_agenda WHERE id = ?').get(id) });
});

router.delete('/gramsabha/agenda/:id', (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM gram_sabha_agenda WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ ok: false, error: 'Agenda item not found', code: 'NOT_FOUND' });
  res.status(204).end();
});

router.post('/gramsabha/:id/attendance', (req, res) => {
  const meeting_id = Number(req.params.id);
  const meeting = db.prepare('SELECT 1 FROM gram_sabha_meetings WHERE id = ?').get(meeting_id);
  if (!meeting) return res.status(404).json({ ok: false, error: 'Gram Sabha meeting not found', code: 'NOT_FOUND' });
  const attendees = Array.isArray(req.body) ? req.body : [];
  if (attendees.length === 0) {
    return res.status(400).json({ ok: false, error: 'Attendees array is required', code: 'BAD_DATA' });
  }
  const upsert = db.prepare(`
    INSERT INTO gram_sabha_attendance (
      meeting_id, citizen_name_en, citizen_name_mr, ward_no, mobile, signed_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);
  const tx = db.transaction((list) => {
    for (const a of list) {
      const citizen_name_en = String(a.citizen_name_en || '').trim();
      if (!citizen_name_en) continue;
      const citizen_name_mr = String(a.citizen_name_mr || '').trim();
      const ward_no = a.ward_no ? Number(a.ward_no) : 0;
      const mobile = String(a.mobile || '').trim();
      upsert.run(meeting_id, citizen_name_en, citizen_name_mr || null, ward_no, mobile || null);
    }
  });
  tx(attendees);
  const count = db.prepare('SELECT COUNT(*) c FROM gram_sabha_attendance WHERE meeting_id = ?').get(meeting_id).c;
  db.prepare('UPDATE gram_sabha_meetings SET attendance_count = ?, updated_at = datetime(\'now\') WHERE id = ?').run(count, meeting_id);
  const rows = db.prepare('SELECT * FROM gram_sabha_attendance WHERE meeting_id = ? ORDER BY ward_no ASC, citizen_name_en ASC').all(meeting_id);
  res.json({ ok: true, data: rows, count, message: `${rows.length} attendance records saved` });
});

module.exports = router;
