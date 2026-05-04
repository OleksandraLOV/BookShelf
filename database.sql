DROP DATABASE IF EXISTS bookshelf_db;
CREATE DATABASE bookshelf_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bookshelf_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  city VARCHAR(80) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  city VARCHAR(80) NOT NULL,
  type ENUM('Продаж', 'Обмін') NOT NULL,
  book_condition VARCHAR(80) NOT NULL,
  price DECIMAL(10,2) NULL,
  image_url TEXT NULL,
  description TEXT NOT NULL,
  seller_note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sessions (
  token VARCHAR(64) PRIMARY KEY,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Демо паролі для всіх користувачів: password123
-- Формат password_hash: salt:hash, де hash створений через Node.js crypto.scryptSync
INSERT INTO users (full_name, email, password_hash, city) VALUES
('Олександра Л.', 'oleksandra@example.com', 'bookshelf_demo_1:9fcf901b4d12084b0ba54ae2d0cefc94c220dd0c24004af732e60dab34794e70ceb8d3d9b5fc0d82b562bc3c826a8c79ff356d8f4ac12948ddda29f983ea474e', 'Київ'),
('Марта К.', 'marta@example.com', 'bookshelf_demo_2:c0ce224b03c250d771708ede84d21ae6fe5abcaebfda8a24405556bd4023c5bfeed9cd6a7f59033e7ea69e4dfda4097039d9376cc6a90fd10477cd05a9d4cab8', 'Львів'),
('Юлія Т.', 'yulia@example.com', 'bookshelf_demo_3:2a8d80485bb384320eb509788847fd1c5e6e71440c06a2bae1a038a41443d5fb1b14f61e6ce84e4fcac93aef1226ce0d265ce3c3d2345c4db5536d05d5f89235', 'Львів');

INSERT INTO books (user_id, title, city, type, book_condition, price, image_url, description, seller_note) VALUES
(1, 'Шістка воронів', 'Київ', 'Продаж', 'Дуже добрий', 320, 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80', 'Фентезійний роман з динамічним сюжетом і добре збереженим виданням.', 'Є кілька незначних слідів користування на обкладинці.'),
(2, 'Гордість і упередження', 'Львів', 'Обмін', 'Добрий', NULL, 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=900&q=80', 'Класичний роман для обміну на сучасну прозу або фентезі.', 'Цікавить обмін на книгу схожого обсягу.'),
(1, 'Маленький принц', 'Київ', 'Продаж', 'Новий', 180, 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80', 'Нова книга без пошкоджень, чудово підійде на подарунок.', 'Можу відправити Новою поштою.'),
(3, '451° за Фаренгейтом', 'Львів', 'Продаж', 'Вживаний', 140, 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80', 'Бюджетний варіант для читання, є помірні сліди використання.', 'Можливий самовивіз у центрі міста.');
