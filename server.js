const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());

// Allow CORS (important for Netlify)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST');
  next();
});

// Serve frontend files
app.use(express.static(path.join(__dirname, '../public')));

// DATABASE – this works 100% on Railway
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  // fallback for local testing
  pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
  });
}

// Create table once
pool.query(`
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id TEXT UNIQUE,
    timestamp TEXT,
    name TEXT,
    phone TEXT,
    city TEXT,
    address TEXT,
    total INTEGER,
    items JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(() => {});

// POST /order
app.post('/order', async (req, res) => {
  try {
    const { name, phone, city, address, total, cart } = req.body;
    if (!name || !phone || !cart?.length) return res.status(400).json({success:false});

    const orderId = 'BASSIM-' + Date.now();
    const timestamp = new Date().toLocaleString('fr-MA');

    await pool.query(
      `INSERT INTO orders (order_id, timestamp, name, phone, city, address, total, items)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [orderId, timestamp, name, phone, city, address, total, cart]
    );

    res.json({success: true, orderId});
  } catch (e) {
    console.error(e);
    res.status(500).json({success: false});
  }
});

// GET /orders – view all
app.get('/orders', async (req, res) => {
  const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  res.json(result.rows);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));