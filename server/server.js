// server/server.js - entry point; starts Express server, prints welcome banner
const os = require('os');
const config = require('./config');
const db = require('./db');

const PORT = config.PORT;

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

db.init()
  .then(() => {
    const app = require('./app');
    app.listen(PORT, '0.0.0.0', () => {
  const bar = '═'.repeat(62);
  const localIPs = getLocalIPs();
  const lanLines = localIPs.map(ip =>
    `  → LAN Access (${nameForIP(ip)}):  http://${ip}:${PORT}/`
  ).join('\n');
  const adminLanLines = localIPs.map(ip =>
    `  → Admin (LAN):         http://${ip}:${PORT}/admin`
  ).join('\n');
  const welcome = `
${bar}
  Dumbarwadi Gram Panchayat — Government Portal (Live)
${bar}
  → Localhost:           http://localhost:${PORT}/
  → Admin Panel (Local): http://localhost:${PORT}/admin
${lanLines}
${adminLanLines}
  → Public API Base:     http://localhost:${PORT}/api/
  → Demo Admin User:     admin
  → Demo Admin Pass:     admin123
  → Reset DB anytime:    npm run seed   (then restart server)
  ⓘ  Demo only — do NOT use this password in production.
  ⓘ  Open any URL above in Chrome to view the site!
${bar}`;
  console.log(welcome);
    });
  })
  .catch(err => { console.error('Failed to connect to MongoDB:', err); process.exit(1); });

function nameForIP(ip) {
  if (ip.startsWith('192.168.')) return 'Wi-Fi/Router';
  if (ip.startsWith('10.')) return 'Private LAN';
  if (ip.startsWith('172.')) return 'Docker/VPN';
  return 'LAN';
}
