const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : null;
  const status = typeof req.query.status === 'string' ? req.query.status : null;
  let where = [];
  const params = [];
  if (category) { where.push('(category_en = ? OR category_mr = ?)'); params.push(category, category); }
  if (status) { where.push('status = ?'); params.push(status); }
  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = db.prepare(`
    SELECT * FROM projects
    ${whereStr}
    ORDER BY created_at DESC
    LIMIT 200
  `).all(...params);
  const enriched = rows.map(r => ({
    ...r,
    photos: r.photos ? JSON.parse(r.photos) : [],
  }));
  return res.json({ ok: true, data: enriched });
});

router.get('/summary', (req, res) => {
  const rows = db.prepare(`
    SELECT status,
           COUNT(*) AS count,
           COALESCE(SUM(cost_total), 0) AS cost_total
    FROM projects
    GROUP BY status
  `).all();
  const totals = db.prepare(`
    SELECT
      COUNT(*) AS total_projects,
      COALESCE(SUM(cost_total), 0) AS total_cost,
      COALESCE(SUM(cost_spent), 0) AS total_spent
    FROM projects
  `).get();
  const byStatus = {};
  rows.forEach(r => { byStatus[r.status] = { count: r.count, cost_total: r.cost_total }; });
  return res.json({
    ok: true,
    data: {
      ...totals,
      by_status: byStatus,
    },
  });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!row) {
    return res.status(404).json({ ok: false, error: 'Project not found', code: 'NOT_FOUND' });
  }
  return res.json({
    ok: true,
    data: {
      ...row,
      photos: row.photos ? JSON.parse(row.photos) : [],
    },
  });
});

module.exports = router;
