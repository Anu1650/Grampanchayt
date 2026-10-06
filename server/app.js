// server/app.js - Express application wiring
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cookieSession = require('cookie-session');

const config = require('./config');
const db = require('./db');
const { seedAll, tablesEmpty } = require('./seed');
const { issueToken } = require('./middleware/csrf');
const publicRoutes = require('./routes/public');
const adminAuthRoutes = require('./routes/adminAuth');
const adminRoutes = require('./routes/admin');
const citizenAuthRoutes = require('./routes/citizenAuth');
const citizenPrivateRoutes = require('./routes/citizenPrivate');
const serviceApplicationsRoutes = require('./routes/serviceApplications');
const complaintsRoutes = require('./routes/complaints');
const gramsabhaPublicRoutes = require('./routes/gramsabhaPublic');
const projectsPublicRoutes = require('./routes/projectsPublic');
const searchRoutes = require('./routes/search');
const panchayatMembersPublicRoutes = require('./routes/panchayatMembersPublic');
const contactMessagesRoutes = require('./routes/contactMessages');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(morgan('dev'));
app.use(express.json({ limit: '8mb' }));

app.use(cookieSession({
  name: 'gp_session',
  keys: [config.SESSION_SECRET],
  maxAge: config.SESSION_MAX_AGE_MS,
  httpOnly: true,
  sameSite: 'lax',
  signed: true,
}));

// Auto-seed on first boot
if (tablesEmpty()) {
  console.log('ⓘ Empty DB detected — running initial seed.');
  seedAll(false);
  db.flushNow().then(() => console.log('✓ DB seeded successfully and synced to MongoDB.'));
}

// Main public site — root frontend files
const ROOT_DIR = path.resolve(__dirname, '..');
app.use(express.static(ROOT_DIR, { index: ['index.html'], extensions: ['html'] }));

// CSRF token
app.get('/api/csrf-token', issueToken);

// Public API
app.use('/api', publicRoutes);

// Citizen auth endpoints
app.use('/api/citizen', citizenAuthRoutes);

// Citizen private endpoints (gated)
app.use('/api/citizen', citizenPrivateRoutes);

// Service applications
app.use('/api/service-applications', serviceApplicationsRoutes);

// Complaints
app.use('/api/complaints', complaintsRoutes);

// Gram Sabha public
app.use('/api/gram-sabha', gramsabhaPublicRoutes);

// Projects public
app.use('/api/projects', projectsPublicRoutes);

// Search
app.use('/api/search', searchRoutes);

// Panchayat members public
app.use('/api/panchayat-members', panchayatMembersPublicRoutes);

// Contact messages
app.use('/api/contact-messages', contactMessagesRoutes);

// Admin auth endpoints (separate router so /api/admin/login is before the requireAdmin gate)
app.use('/api/admin', adminAuthRoutes);

// Admin CRUD (gated with requireAdmin inside router)
app.use('/api/admin', adminRoutes);

// Admin panel HTML
app.get('/admin', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'views', 'admin.html'));
});

// 404 JSON fallback for /api/*, otherwise fall through to index.html (SPA)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found', code: 'NOT_FOUND' });
});

// Error middleware
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: err.message || 'Internal server error', code: 'SERVER_ERROR' });
});

module.exports = app;
