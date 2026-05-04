DROP DATABASE IF EXISTS bookshelf_db;
CREATE DATABASE bookshelf_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE bookshelf_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  city VARCHAR(80) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,

  title VARCHAR(200) NOT NULL,
  description TEXT,
  condition_book ENUM('new', 'excellent', 'good', 'used') NOT NULL DEFAULT 'good',
  type ENUM('sell', 'exchange') NOT NULL,
  city VARCHAR(80) NOT NULL,

  image_url TEXT NULL,
  price DECIMAL(10,2) NULL,
  seller_note TEXT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_user_id ON listings(user_id);

-- Демо-пароль для користувачів: password123
INSERT INTO users (name, email, password, city) VALUES
(
  'Олександра Л.',
  'oleksandra@example.com',
  '$2b$10$TRmX1zwik3IYElgQI0O7MOJJVybmpVn6Jqiy9/kb42P2F.A7jE.3S',
  'Київ'
),
(
  'Марта К.',
  'marta@example.com',
  '$2b$10$TRmX1zwik3IYElgQI0O7MOJJVybmpVn6Jqiy9/kb42P2F.A7jE.3S',
  'Львів'
);

INSERT INTO listings (
  user_id,
  title,
  description,
  condition_book,
  type,
  city,
  image_url,
  price,
  seller_note
) VALUES
(
  1,
  'Шістка воронів',
  'Фентезійний роман у доброму стані. Підійде для тих, хто любить пригоди, командну динаміку та темне фентезі.',
  'excellent',
  'sell',
  'Київ',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80',
  320.00,
  'Є кілька незначних слідів користування на обкладинці.'
),
(
  2,
  'Гордість і упередження',
  'Класичний роман для обміну на сучасну прозу або фентезі.',
  'good',
  'exchange',
  'Львів',
  'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=900&q=80',
  NULL,
  'Цікавить обмін на книгу схожого обсягу.'
),
(
  1,
  'Маленький принц',
  'Нова книга без пошкоджень, чудово підійде на подарунок.',
  'new',
  'sell',
  'Київ',
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80',
  180.00,
  'Можу відправити Новою поштою.'
);