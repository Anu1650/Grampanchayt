const express = require('express');
const db = require('../db');
const requireCitizen = require('../middleware/citizenAuth');

const router = express.Router();
router.use(requireCitizen);

router.get('/me/applications', (req, res) => {
  const citizenId = req.session.citizenId;
  const rows = db.prepare(`
    SELECT * FROM service_applications
    WHERE citizen_id = ? OR mobile = ?
    ORDER BY created_at DESC
    LIMIT 200
  `).all(citizenId, req.session.citizenMobile || '');
  const enriched = rows.map(r => ({
    ...r,
    service_specific: r.service_specific ? JSON.parse(r.service_specific) : {},
    documents: r.documents ? JSON.parse(r.documents) : [],
    status_history: r.status_history ? JSON.parse(r.status_history) : [],
  }));
  return res.json({ ok: true, data: enriched });
});

router.get('/me/complaints', (req, res) => {
  const citizenId = req.session.citizenId;
  const rows = db.prepare(`
    SELECT * FROM complaints
    WHERE citizen_id = ? OR complainant_mobile = ?
    ORDER BY created_at DESC
    LIMIT 200
  `).all(citizenId, req.session.citizenMobile || '');
  const enriched = rows.map(r => ({
    ...r,
    photos: r.photos ? JSON.parse(r.photos) : [],
    status_history: r.status_history ? JSON.parse(r.status_history) : [],
    replies: r.replies ? JSON.parse(r.replies) : [],
  }));
  return res.json({ ok: true, data: enriched });
});

module.exports = router;
