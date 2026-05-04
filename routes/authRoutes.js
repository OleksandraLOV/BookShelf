const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, city } = req.body;

    if (!name || !email || !password || !city) {
      return res.status(400).json({
        message: 'Усі поля обов’язкові',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Пароль має бути мінімум 6 символів',
      });
    }

    const checkUserQuery = 'SELECT id FROM users WHERE email = ?';

    db.query(checkUserQuery, [email], async (checkErr, checkResult) => {
      if (checkErr) {
        console.error('❌ Помилка перевірки користувача:', checkErr);
        return res.status(500).json({
          message: 'Помилка сервера при перевірці email',
        });
      }

      if (checkResult.length > 0) {
        return res.status(409).json({
          message: 'Користувач з таким email вже існує',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertUserQuery = `
        INSERT INTO users (name, email, password, city)
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        insertUserQuery,
        [name, email, hashedPassword, city],
        (insertErr, insertResult) => {
          if (insertErr) {
            console.error('❌ Помилка створення користувача:', insertErr);
            return res.status(500).json({
              message: 'Помилка сервера при створенні користувача',
            });
          }

          return res.status(201).json({
            message: 'Користувача зареєстровано успішно',
            userId: insertResult.insertId,
          });
        },
      );
    });
  } catch (error) {
    console.error('❌ Загальна помилка:', error);
    return res.status(500).json({
      message: 'Внутрішня помилка сервера',
    });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email і пароль обов’язкові',
    });
  }

  const query = 'SELECT * FROM users WHERE email = ?';

  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('❌ Помилка логіну:', err);
      return res.status(500).json({
        message: 'Помилка сервера',
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: 'Невірний email або пароль',
      });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: 'Невірний email або пароль',
      });
    }

    return res.json({
      message: 'Успішний вхід',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
      },
    });
  });
});

router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, city, currentPassword, newPassword } = req.body;

  if (!name || !email || !city) {
    return res.status(400).json({
      message: 'Ім’я, email і місто обов’язкові',
    });
  }

  if (newPassword && newPassword.length < 6) {
    return res.status(400).json({
      message: 'Новий пароль має бути мінімум 6 символів',
    });
  }

  const checkUserQuery = 'SELECT * FROM users WHERE id = ?';

  db.query(checkUserQuery, [id], async (checkErr, checkResult) => {
    if (checkErr) {
      console.error('❌ Помилка перевірки користувача:', checkErr);

      return res.status(500).json({
        message: 'Помилка сервера',
      });
    }

    if (checkResult.length === 0) {
      return res.status(404).json({
        message: 'Користувача не знайдено',
      });
    }

    const user = checkResult[0];

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          message: 'Поточний пароль обов’язковий для зміни пароля',
        });
      }

      const isPasswordCorrect = await bcrypt.compare(
        currentPassword,
        user.password,
      );

      if (!isPasswordCorrect) {
        return res.status(401).json({
          message: 'Поточний пароль введено неправильно',
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updateWithPasswordQuery = `
        UPDATE users
        SET name = ?, email = ?, city = ?, password = ?
        WHERE id = ?
      `;

      db.query(
        updateWithPasswordQuery,
        [name, email, city, hashedPassword, id],
        (updateErr) => {
          if (updateErr) {
            console.error('❌ Помилка оновлення профілю:', updateErr);

            if (updateErr.code === 'ER_DUP_ENTRY') {
              return res.status(409).json({
                message: 'Користувач з таким email вже існує',
              });
            }

            return res.status(500).json({
              message: 'Помилка сервера при оновленні профілю',
            });
          }

          return res.json({
            message: 'Профіль оновлено успішно',
            user: {
              id: Number(id),
              name,
              email,
              city,
            },
          });
        },
      );

      return;
    }

    const updateQuery = `
      UPDATE users
      SET name = ?, email = ?, city = ?
      WHERE id = ?
    `;

    db.query(updateQuery, [name, email, city, id], (updateErr) => {
      if (updateErr) {
        console.error('❌ Помилка оновлення профілю:', updateErr);

        if (updateErr.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({
            message: 'Користувач з таким email вже існує',
          });
        }

        return res.status(500).json({
          message: 'Помилка сервера при оновленні профілю',
        });
      }

      return res.json({
        message: 'Профіль оновлено успішно',
        user: {
          id: Number(id),
          name,
          email,
          city,
        },
      });
    });
  });
});

module.exports = router;
