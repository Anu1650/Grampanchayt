module.exports = function requireCitizen(req, res, next) {
  if (req.session && req.session.citizenId) return next();
  return res.status(401).json({ ok: false, error: 'Citizen authentication required', code: 'NOT_AUTHENTICATED' });
};
