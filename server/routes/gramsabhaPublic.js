const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/upcoming', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const meeting = db.prepare(`
    SELECT * FROM gram_sabha_meetings
    WHERE meeting_date >= ?
    ORDER BY meeting_date ASC
    LIMIT 1
  `).get(today);
  if (!meeting) {
    return res.json({ ok: true, data: null });
  }
  const agenda = db.prepare(`
    SELECT * FROM gram_sabha_agenda
    WHERE meeting_id = ?
    ORDER BY item_no ASC
  `).all(meeting.id);
  return res.json({
    ok: true,
    data: { ...meeting, agenda },
  });
});

router.get('/past', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 20;
  const rows = db.prepare(`
    SELECT * FROM gram_sabha_meetings
    WHERE meeting_date < ?
    ORDER BY meeting_date DESC
    LIMIT ?
  `).all(today, limit);
  const ids = rows.map(r => r.id);
  const agendaMap = new Map();
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    const agendaRows = db.prepare(`
      SELECT * FROM gram_sabha_agenda
      WHERE meeting_id IN (${placeholders})
      ORDER BY meeting_id ASC, item_no ASC
    `).all(...ids);
    agendaRows.forEach(a => {
      if (!agendaMap.has(a.meeting_id)) agendaMap.set(a.meeting_id, []);
      agendaMap.get(a.meeting_id).push(a);
    });
  }
  const enriched = rows.map(m => ({
    ...m,
    agenda: agendaMap.get(m.id) || [],
  }));
  return res.json({ ok: true, data: enriched });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const meeting = db.prepare('SELECT * FROM gram_sabha_meetings WHERE id = ?').get(id);
  if (!meeting) {
    return res.status(404).json({ ok: false, error: 'Gram Sabha meeting not found', code: 'NOT_FOUND' });
  }
  const agenda = db.prepare(`
    SELECT * FROM gram_sabha_agenda
    WHERE meeting_id = ?
    ORDER BY item_no ASC
  `).all(id);
  const attendance = db.prepare(`
    SELECT * FROM gram_sabha_attendance
    WHERE meeting_id = ?
    ORDER BY ward_no ASC, citizen_name_en ASC
  `).all(id);
  return res.json({
    ok: true,
    data: { ...meeting, agenda, attendance },
  });
});

module.exports = router;
