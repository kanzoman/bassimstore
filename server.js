const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

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

app.post('/order', async (req, res) => {
  try {
    const { name, phone, city, address, total, cart } = req.body;

    if (!name || !phone || !city || !address || !cart?.length) {
      return res.status(400).json({ success: false });
    }

    const orderId = 'BASSIM-' + Date.now();

    await pool.query(
      `INSERT INTO orders (order_id, timestamp, name, phone, city, address, total, items)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        orderId,
        new Date().toLocaleString('fr-MA'),
        name,
        phone,
        city,
        address,
        total,
        JSON.stringify(cart)   // ← fixed
      ]
    );

    res.json({ success: true, orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get('/orders', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  res.json(rows);
});

app.listen(process.env.PORT || 3000);