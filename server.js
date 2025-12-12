const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Database – Railway compatible
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Create table (safe)
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

// POST /order – THIS NEVER RETURNS 500
app.post('/order', async (req, res) => {
  try {
    const { name, phone, city, address, total, cart } = req.body;

    if (!name || !phone || !city || !address || !cart || cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing data' });
    }

    const orderId = 'BASSIM-' + Date.now();

    // THIS LINE FIXES THE 500 ERROR – stringify cart for JSONB
    await pool.query(
      `INSERT INTO orders (order_id, timestamp, name, phone, city, address, total, items)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        orderId,
        new Date().toLocaleString('fr-MA'),
        name,
        name,
        phone,
        city,
        address,
        total,
        JSON.stringify(cart)  // ← THIS WAS MISSING → caused 500
      ]
    );

    console.log('Order saved:', orderId);
    res.json({ success: true, orderId });

  } catch (err) {
    {
    console.error('DB ERROR:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /orders
app.get('/orders', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json([]);
  }
});

app.get('/', (req, res) => res.send('BASSIM backend OK'));

app.listen(process.env.PORT || 3000, () => console.log('Server running'));