// server/config.js - runtime configuration
const path = require('path');
const fs = require('fs');

// Load .env file if present (simple KEY=VALUE parser, no extra dependency)
try {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
} catch (e) { /* ignore */ }

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  ROOT: path.resolve(__dirname, '..'),
  DB_PATH: path.resolve(__dirname, '..', 'data', 'gp.db'),
  DATA_DIR: path.resolve(__dirname, '..', 'data'),
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-secret-change-me-please-in-production',
  SESSION_MAX_AGE_MS: 8 * 60 * 60 * 1000, // 8h
  MONGODB_URI: process.env.MONGODB_URI || '',
  MONGODB_DB: process.env.MONGODB_DB || 'gp_portal',
  DEMO_ADMIN_USERNAME: 'admin',
  DEMO_ADMIN_PASSWORD: 'admin123',
  DEMO_ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || '$2a$10$QSBdbX56g1Rfo7cznVtlGeLjn1YbgJLH.dFFnfCBfe9WDNJCvawKa',
};
