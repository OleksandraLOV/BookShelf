# BookShelf Diploma Project

Оновлена версія дипломного MVP уже має:

- окремі сторінки `index.html`, `catalog.html`, `profile.html`
- Express + MySQL backend
- реєстрацію, вхід, вихід
- сесію через токен
- створення, редагування і видалення тільки власних оголошень
- профіль, що працює не через фіксований `userId=1`, а через поточного користувача

## Структура

- `index.html` — головна сторінка
- `catalog.html` — каталог оголошень
- `profile.html` — профіль користувача
- `assets/css/styles.css` — усі стилі
- `assets/js/app.js` — frontend-логіка з `fetch`
- `server.js` — Express backend
- `database.sql` — схема MySQL і демо-дані
- `.env.example` — приклад змінних середовища

## API, що вже працює

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/books`
- `GET /api/books/:id`
- `POST /api/books`
- `PUT /api/books/:id`
- `DELETE /api/books/:id`
- `GET /api/users/:id`
- `GET /api/users/:id/books`
- `GET /api/users/me/books`
- `GET /api/health`

## Як запустити код

### 1) Встановіть залежності

У папці проєкту виконайте:

```bash
npm install
```

### 2) Створіть `.env`

Скопіюйте приклад:

```bash
cp .env.example .env
```

На Windows, якщо `cp` не працює, просто створіть файл `.env` вручну і вставте:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=bookshelf_db
SESSION_TTL_DAYS=7
```

### 3) Імпортуйте базу даних

#### Варіант через MySQL Workbench

1. Відкрийте MySQL Workbench.
2. Підключіться до локального сервера MySQL.
3. Відкрийте файл `database.sql`.
4. Запустіть весь SQL-скрипт.

#### Варіант через термінал

```bash
mysql -u root -p < database.sql
```

Після цього буде створена база `bookshelf_db` з демо-користувачами і книгами.

### 4) Запустіть сервер

Для звичайного запуску:

```bash
npm start
```

Для режиму розробки:

```bash
npm run dev
```

### 5) Відкрийте сайт

У браузері відкрийте:

```text
http://localhost:3000
```

## Демо-вхід

Можна увійти так:

- email: `oleksandra@example.com`
- password: `password123`

## Якщо не запускається

### Помилка `ER_ACCESS_DENIED_ERROR`

Неправильний логін або пароль до MySQL. Перевірте `DB_USER` і `DB_PASSWORD` у `.env`.

### Помилка `Unknown database 'bookshelf_db'`

Ви ще не виконали `database.sql`.

### Помилка `Cannot find module`

Не виконано `npm install`.

### Сайт відкривається, але даних немає

Перевірте, чи справді запущено MySQL і чи сервер Node не впав при старті.

## Що ще можна вдосконалити далі

Найлогічніші наступні кроки:

1. завантаження фото через `multer`, а не через URL
2. відновлення пароля
3. редагування профілю
4. сторінка повідомлень або форма зв’язку з продавцем
5. валідація на клієнті й сервері на глибшому рівні
6. ролі `admin / user` за потреби
