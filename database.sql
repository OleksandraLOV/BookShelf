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