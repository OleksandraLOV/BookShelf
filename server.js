const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');

const app = express();

app.use(cors());
app.use(express.json());

db.connect((err) => {
  if (err) {
    console.error('❌ Помилка підключення до MySQL:', err);
    return;
  }
  console.log('✅ Підключено до MySQL');
});

app.get('/', (req, res) => {
  res.send('Server працює 🚀');
});

app.use('/api', authRoutes);
app.use('/api', listingRoutes);

app.listen(3000, () => {
  console.log('✅ Сервер запущено на http://localhost:3000');
});
