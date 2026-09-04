const fs = require("fs");
const path = require("path");

let pool;
let schemaReady = false;

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function hasPostgres() {
  return Boolean(process.env.DATABASE_URL);
}

async function getPool() {
  if (!pool) {
    const { Pool } = require("pg");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: String(process.env.DATABASE_URL).includes("localhost")
        ? false
        : { rejectUnauthorized: false },
    });
  }
  if (!schemaReady) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT,
        phone TEXT,
        phone_digits TEXT,
        product TEXT,
        message TEXT,
        date TEXT,
        date_iso TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_history_user ON history (user_id, date_iso DESC);
    `);
    schemaReady = true;
  }
  return pool;
}

function dataDir() {
  return process.env.DATA_DIR || path.join(__dirname, "..", "data");
}

function dbPath() {
  const preferred = path.join(dataDir(), "store.json");
  try {
    fs.mkdirSync(path.dirname(preferred), { recursive: true });
    fs.accessSync(path.dirname(preferred), fs.constants.W_OK);
    return preferred;
  } catch (error) {
    return path.join("/tmp", "posvenda-store.json");
  }
}

function readFileDb() {
  try {
    return JSON.parse(fs.readFileSync(dbPath(), "utf8"));
  } catch (error) {
    return { users: [], history: [] };
  }
}

function writeFileDb(db) {
  const file = dbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(db, null, 2));
}

async function createUser(username, passwordHash) {
  const user = {
    id: createId(),
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  if (hasPostgres()) {
    const db = await getPool();
    await db.query(
      "INSERT INTO users (id, username, password_hash, created_at) VALUES ($1, $2, $3, $4)",
      [user.id, user.username, user.passwordHash, user.createdAt]
    );
    return user;
  }

  const db = readFileDb();
  db.users.push({
    id: user.id,
    username: user.username,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
  });
  writeFileDb(db);
  return user;
}

async function findUserByUsername(username) {
  const normalized = String(username || "").trim().toLowerCase();
  if (hasPostgres()) {
    const db = await getPool();
    const result = await db.query(
      "SELECT id, username, password_hash AS \"passwordHash\" FROM users WHERE LOWER(username) = $1 LIMIT 1",
      [normalized]
    );
    return result.rows[0] || null;
  }

  const db = readFileDb();
  return (
    db.users.find((user) => String(user.username).toLowerCase() === normalized) || null
  );
}

function mapHistoryRow(row) {
  return {
    id: row.id,
    name: row.name || "",
    phone: row.phone || "",
    phoneDigits: row.phone_digits || row.phoneDigits || "",
    product: row.product || "",
    message: row.message || "",
    date: row.date || "",
    dateISO: row.date_iso || row.dateISO || "",
  };
}

async function listHistory(userId) {
  if (hasPostgres()) {
    const db = await getPool();
    const result = await db.query(
      "SELECT * FROM history WHERE user_id = $1 ORDER BY date_iso DESC",
      [userId]
    );
    return result.rows.map(mapHistoryRow);
  }

  const db = readFileDb();
  return db.history
    .filter((item) => item.userId === userId)
    .map(mapHistoryRow)
    .sort((a, b) => String(b.dateISO).localeCompare(String(a.dateISO)));
}

async function addHistory(userId, entry) {
  const item = {
    id: entry.id || createId(),
    userId,
    name: entry.name || "",
    phone: entry.phone || "",
    phoneDigits: entry.phoneDigits || "",
    product: entry.product || "",
    message: entry.message || "",
    date: entry.date || "",
    dateISO: entry.dateISO || "",
  };

  if (hasPostgres()) {
    const db = await getPool();
    await db.query(
      `INSERT INTO history
        (id, user_id, name, phone, phone_digits, product, message, date, date_iso)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        item.id,
        userId,
        item.name,
        item.phone,
        item.phoneDigits,
        item.product,
        item.message,
        item.date,
        item.dateISO,
      ]
    );
    return mapHistoryRow(item);
  }

  const db = readFileDb();
  db.history.unshift(item);
  writeFileDb(db);
  return mapHistoryRow(item);
}

async function replaceHistory(userId, entries) {
  const normalized = (Array.isArray(entries) ? entries : []).map((entry) => ({
    id: entry.id || createId(),
    userId,
    name: entry.name || "",
    phone: entry.phone || "",
    phoneDigits: entry.phoneDigits || "",
    product: entry.product || "",
    message: entry.message || "",
    date: entry.date || "",
    dateISO: entry.dateISO || "",
  }));

  if (hasPostgres()) {
    const db = await getPool();
    await db.query("DELETE FROM history WHERE user_id = $1", [userId]);
    for (const item of normalized) {
      await db.query(
        `INSERT INTO history
          (id, user_id, name, phone, phone_digits, product, message, date, date_iso)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          item.id,
          userId,
          item.name,
          item.phone,
          item.phoneDigits,
          item.product,
          item.message,
          item.date,
          item.dateISO,
        ]
      );
    }
    return normalized.map(mapHistoryRow);
  }

  const db = readFileDb();
  db.history = db.history.filter((item) => item.userId !== userId).concat(normalized);
  writeFileDb(db);
  return normalized.map(mapHistoryRow);
}

module.exports = {
  createUser,
  findUserByUsername,
  listHistory,
  addHistory,
  replaceHistory,
};
