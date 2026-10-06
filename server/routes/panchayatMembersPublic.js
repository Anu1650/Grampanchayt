const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM panchayat_members
    ORDER BY
      CASE role_en
        WHEN 'Sarpanch' THEN 1
        WHEN 'Deputy Sarpanch' THEN 2
        WHEN 'Gram Sevak (Secretary)' THEN 3
        ELSE 4
      END,
      ward_no ASC,
      name_en ASC
  `).all();
  return res.json({ ok: true, data: rows });
});

module.exports = router;
