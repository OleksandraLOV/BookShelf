const express = require('express');
const db = require('../config/db');

const router = express.Router();

function normalizePrice(type, price) {
  if (type !== 'sell') return null;
  if (price === undefined || price === null || price === '') return null;

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice) || numericPrice < 0) {
    return null;
  }

  return numericPrice;
}

router.post('/listings', (req, res) => {
  const {
    title,
    description,
    condition_book,
    type,
    city,
    user_id,
    image_url,
    price,
    seller_note,
  } = req.body;

  if (!title || !type || !city || !user_id) {
    return res.status(400).json({
      message: 'Поля title, type, city, user_id обов’язкові',
    });
  }

  if (type !== 'sell' && type !== 'exchange') {
    return res.status(400).json({
      message: 'Тип оголошення має бути sell або exchange',
    });
  }

  const checkUserQuery = 'SELECT id FROM users WHERE id = ?';

  db.query(checkUserQuery, [user_id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('❌ Помилка перевірки користувача:', checkErr);

      return res.status(500).json({
        message: 'Помилка сервера при перевірці користувача',
      });
    }

    if (checkResult.length === 0) {
      return res.status(404).json({
        message: 'Користувача не знайдено',
      });
    }

    const insertListingQuery = `
      INSERT INTO listings (
        title,
        description,
        condition_book,
        type,
        city,
        user_id,
        image_url,
        price,
        seller_note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertListingQuery,
      [
        title,
        description || '',
        condition_book || 'good',
        type,
        city,
        user_id,
        image_url || null,
        normalizePrice(type, price),
        seller_note || null,
      ],
      (insertErr, insertResult) => {
        if (insertErr) {
          console.error('❌ Помилка створення оголошення:', insertErr);

          return res.status(500).json({
            message: 'Помилка сервера при створенні оголошення',
          });
        }

        return res.status(201).json({
          message: 'Оголошення створено успішно',
          listingId: insertResult.insertId,
        });
      },
    );
  });
});

router.get('/listings', (req, res) => {
  const { title, city, type } = req.query;

  let query = `
    SELECT 
      listings.*,
      users.name AS user_name
    FROM listings
    JOIN users ON listings.user_id = users.id
    WHERE 1=1
  `;

  const values = [];

  if (title) {
    query += ' AND listings.title LIKE ?';
    values.push(`%${title}%`);
  }

  if (city && city !== 'all') {
    query += ' AND listings.city = ?';
    values.push(city);
  }

  if (type && type !== 'all') {
    query += ' AND listings.type = ?';
    values.push(type);
  }

  query += ' ORDER BY listings.created_at DESC';

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('❌ Помилка отримання оголошень:', err);

      return res.status(500).json({
        message: 'Помилка сервера',
      });
    }

    return res.json(results);
  });
});

router.get('/listings/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      listings.*,
      users.name AS user_name,
      users.email AS seller_email
    FROM listings
    JOIN users ON listings.user_id = users.id
    WHERE listings.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('❌ Помилка отримання оголошення:', err);

      return res.status(500).json({
        message: 'Помилка сервера',
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: 'Оголошення не знайдено',
      });
    }

    return res.json(results[0]);
  });
});

router.get('/my-listings/:userId', (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT 
      listings.*,
      users.name AS user_name
    FROM listings
    JOIN users ON listings.user_id = users.id
    WHERE listings.user_id = ?
    ORDER BY listings.created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('❌ Помилка отримання моїх оголошень:', err);

      return res.status(500).json({
        message: 'Помилка сервера',
      });
    }

    return res.json(results);
  });
});

router.put('/listings/:id', (req, res) => {
  const listingId = req.params.id;

  const {
    title,
    description,
    condition_book,
    type,
    city,
    user_id,
    image_url,
    price,
    seller_note,
  } = req.body;

  if (!user_id) {
    return res.status(400).json({
      message: 'Потрібен user_id',
    });
  }

  if (type !== 'sell' && type !== 'exchange') {
    return res.status(400).json({
      message: 'Тип оголошення має бути sell або exchange',
    });
  }

  const checkQuery = 'SELECT user_id FROM listings WHERE id = ?';

  db.query(checkQuery, [listingId], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: 'Помилка сервера',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: 'Оголошення не знайдено',
      });
    }

    if (Number(result[0].user_id) !== Number(user_id)) {
      return res.status(403).json({
        message: 'Немає доступу',
      });
    }

    const updateQuery = `
      UPDATE listings
      SET 
        title = ?,
        description = ?,
        condition_book = ?,
        type = ?,
        city = ?,
        image_url = ?,
        price = ?,
        seller_note = ?
      WHERE id = ?
    `;

    db.query(
      updateQuery,
      [
        title,
        description || '',
        condition_book || 'good',
        type,
        city,
        image_url || null,
        normalizePrice(type, price),
        seller_note || null,
        listingId,
      ],
      (updateErr) => {
        if (updateErr) {
          console.error('❌ Помилка оновлення оголошення:', updateErr);

          return res.status(500).json({
            message: 'Помилка оновлення',
          });
        }

        return res.json({
          message: 'Оголошення оновлено',
        });
      },
    );
  });
});

router.delete('/listings/:id', (req, res) => {
  const listingId = req.params.id;
  const userId = req.body.user_id;

  if (!userId) {
    return res.status(400).json({
      message: 'Потрібен user_id',
    });
  }

  const checkQuery = 'SELECT user_id FROM listings WHERE id = ?';

  db.query(checkQuery, [listingId], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: 'Помилка сервера',
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: 'Оголошення не знайдено',
      });
    }

    if (Number(result[0].user_id) !== Number(userId)) {
      return res.status(403).json({
        message: 'Немає доступу',
      });
    }

    const deleteQuery = 'DELETE FROM listings WHERE id = ?';

    db.query(deleteQuery, [listingId], (deleteErr) => {
      if (deleteErr) {
        return res.status(500).json({
          message: 'Помилка при видаленні',
        });
      }

      return res.json({
        message: 'Оголошення видалено',
      });
    });
  });
});

module.exports = router;
