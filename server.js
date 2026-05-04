const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

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
  res.send('BookShelf API працює');
});

app.use('/api', authRoutes);
app.use('/api', listingRoutes);

app.listen(PORT, () => {
  console.log(`✅ Сервер запущено на http://localhost:${PORT}`);
});
