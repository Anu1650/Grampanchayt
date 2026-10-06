const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 2) {
    return res.status(400).json({ ok: false, error: 'Search query must be at least 2 characters', code: 'BAD_DATA' });
  }
  const like = `%${q}%`;
  const schemes = db.prepare(`
    SELECT id, title_en, title_mr, desc_en, desc_mr, icon, accent, tags_en, tags_mr, scheme_code
    FROM schemes
    WHERE title_en LIKE ? OR title_mr LIKE ? OR desc_en LIKE ? OR desc_mr LIKE ?
    ORDER BY id ASC
    LIMIT 20
  `).all(like, like, like, like);
  const notices = db.prepare(`
    SELECT id, date_iso, title_en, title_mr, desc_en, desc_mr, badge_en, badge_mr, notice_type
    FROM notices
    WHERE title_en LIKE ? OR title_mr LIKE ? OR desc_en LIKE ? OR desc_mr LIKE ?
    ORDER BY date_iso DESC
    LIMIT 20
  `).all(like, like, like, like);
  const services = db.prepare(`
    SELECT id, title_en, title_mr, desc_en, desc_mr, icon
    FROM services
    WHERE title_en LIKE ? OR title_mr LIKE ? OR desc_en LIKE ? OR desc_mr LIKE ?
    ORDER BY id ASC
    LIMIT 20
  `).all(like, like, like, like);
  const projects = db.prepare(`
    SELECT id, title_en, title_mr, category_en, category_mr, status, progress_percent, cost_total
    FROM projects
    WHERE title_en LIKE ? OR title_mr LIKE ? OR description_en LIKE ? OR description_mr LIKE ?
    ORDER BY id ASC
    LIMIT 20
  `).all(like, like, like, like);
  return res.json({
    ok: true,
    data: {
      query: q,
      schemes,
      notices,
      services,
      projects,
    },
  });
});

module.exports = router;
