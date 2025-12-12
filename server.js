const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public'))); // Serve your frontend

// Ensure orders.json exists
const ordersFile = path.join(__dirname, 'orders.json');
if (!fs.existsSync(ordersFile)) {
  fs.writeFileSync(ordersFile, JSON.stringify([], null, 2));
}

// POST /order — Receive order from checkout
app.post('/order', (req, res) => {
  try {
    const order = req.body;

    // Basic validation
    if (!order.name || !order.phone || !order.city || !order.address || !order.cart || order.cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Add timestamp and order ID
    const newOrder = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('en-GB', { timeZone: 'Africa/Casablanca' }),
      ...order
    };

    // Read existing orders
    const rawData = fs.readFileSync(ordersFile);
    const orders = JSON.parse(rawData);

    // Append new order
    orders.push(newOrder);

    // Save back to file
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

    console.log(`New order received from ${order.name} - ${order.phone}`);

    res.json({
      success: true,
      message: 'Order confirmed successfully!',
      orderId: newOrder.id
    });

  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Optional: View all orders (for admin only - remove in production if needed)
app.get('/admin-orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'orders.json'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Checkout will send orders to http://localhost:${PORT}/order`);
});

app.get("/orders", (req, res) => {
  const orders = JSON.parse(fs.readFileSync("orders.json"));
  res.json(orders);
});
