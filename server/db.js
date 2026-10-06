// server/db.js - MongoDB Atlas is the persistent store.
// At boot we restore the SQLite schema + rows into an in-memory better-sqlite3
// database (so all existing route/seed code keeps working), and every write is
// flushed back to MongoDB (write-through persistence to the Atlas cluster).
const { MongoClient } = require('mongodb');
const Database = require('better-sqlite3');
const config = require('./config');

let inner = null;
let mongoClient = null;
let mongoDb = null;
let dirty = false;
let flushing = false;
let flushTimer = null;

async function init() {
  if (inner) return;
  mongoClient = new MongoClient(config.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  await mongoClient.connect();
  mongoDb = mongoClient.db(config.MONGODB_DB);
  inner = new Database(':memory:');
  inner.pragma('foreign_keys = OFF');
  await restoreFromMongo();
  inner.pragma('foreign_keys = ON');
  console.log(`✓ Connected to MongoDB Atlas (db: ${config.MONGODB_DB})`);
}

async function restoreFromMongo() {
  const meta = await mongoDb.collection('_gpdb_meta').findOne({ _id: 'schema' });
  if (meta && Array.isArray(meta.tables)) {
    for (const t of meta.tables) {
      try { inner.exec(t.sql); } catch (e) { /* table may already exist */ }
    }
  }
  const cols = await mongoDb.listCollections().toArray();
  for (const c of cols) {
    if (c.name.startsWith('_gpdb')) continue;
    const docs = await mongoDb.collection(c.name).find({}, { projection: { _id: 0 } }).toArray();
    if (!docs.length) continue;
    const keys = Object.keys(docs[0]);
    if (!keys.length) continue;
    const tableSql = meta && Array.isArray(meta.tables) && meta.tables.some(t => t.name === c.name)
      ? null
      : `CREATE TABLE IF NOT EXISTS "${c.name}" (${keys.map(k => `"${k}" TEXT`).join(', ')})`;
    if (tableSql) inner.exec(tableSql);
    const placeholders = keys.map(() => '?').join(',');
    const stmt = inner.prepare(`INSERT INTO "${c.name}" (${keys.map(k => `"${k}"`).join(',')}) VALUES (${placeholders})`);
    const tx = inner.transaction(rows => rows.forEach(r => stmt.run(...keys.map(k => (r[k] === undefined ? null : r[k])))));
    tx(docs);
  }
}

function schedulePersist() {
  dirty = true;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 300);
}

async function flush() {
  if (flushing || !dirty || !inner || !mongoDb) return;
  flushing = true;
  dirty = false;
  try {
    const tables = inner
      .prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all();
    await mongoDb.collection('_gpdb_meta').updateOne(
      { _id: 'schema' },
      { $set: { tables: tables.map(t => ({ name: t.name, sql: t.sql })) } },
      { upsert: true }
    );
    for (const t of tables) {
      const rows = inner.prepare(`SELECT * FROM "${t.name}"`).all();
      const coll = mongoDb.collection(t.name);
      await coll.deleteMany({});
      if (rows.length) await coll.insertMany(rows);
    }
  } catch (err) {
    console.error('MongoDB persist failed:', err.message);
    dirty = true;
  }
  flushing = false;
  if (dirty) schedulePersist();
}

async function flushNow() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  while (dirty) await flush();
  // one final flush in case a flush was in-flight
  if (flushing) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

module.exports = {
  init,
  flushNow,
  pragma(...args) { return inner.pragma(...args); },
  exec(sql) { const r = inner.exec(sql); schedulePersist(); return r; },
  prepare(sql) {
    const stmt = inner.prepare(sql);
    return {
      run(...args) { const info = stmt.run(...args); schedulePersist(); return info; },
      get(...args) { return stmt.get(...args); },
      all(...args) { return stmt.all(...args); },
    };
  },
  transaction(fn) {
    const tx = inner.transaction(fn);
    return (...args) => { const r = tx(...args); schedulePersist(); return r; };
  },
  close() { if (mongoClient) return mongoClient.close(); },
};
