const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Serve frontend (Netlify already does this, but backup)
app.use(express.static(path.join(__dirname, '../public')));

// Connect to Railway PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create table on startup
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
`);

// POST /order – receive order from checkout
app.post('/order', async (req, res) => {
  try {
    const { name, phone, city, address, total, cart } = req.body;

    if (!name || !phone || !cart || cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid data' });
    }

    const orderId = 'BASSIM-' + Date.now();
    const timestamp = new Date().toLocaleString('fr-MA');

    await pool.query(
      `INSERT INTO orders (order_id, timestamp, name, phone, city, address, total, items)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [orderId, timestamp, name, phone, city, address, total, cart]
    );

    res.json({ success: true, orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// GET /orders – view all orders (you open this link)
app.get('/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));