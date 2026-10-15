# REST API Дошки Оголошень

Чистий JSON API без рендерингу HTML для сервісу оголошень. Реалізований на Node.js, Express, TypeScript та Prisma ORM з повною автентифікацією через JWT (ротація Refresh-токенів) та інтегрованою
документацією OpenAPI / Swagger.

---

## 🚀 Основний функціонал

- **Автентифікація та Авторизація (JWT):**

  - Реєстрація користувача з перевіркою унікальності `username` та `email`.
  - Хешування паролів за допомогою `bcrypt`.
  - Вхід у систему з поверненням пари `accessToken` (термін дії 15 хвилин) та `refreshToken` (термін дії 7 днів).
  - Ротація Refresh-токенів (`/auth/refresh`) для захисту від викрадення.
  - Безпечний вихід (`/auth/logout`) із видаленням Refresh-токена з бази даних.
  - Отримання профілю поточного користувача (`/auth/me`).

- **Управління оголошеннями (CRUD):**
  - Публічний перегляд списку оголошень із фільтрацією (`search`), сортуванням (`newest`, `oldest`) та пагінацією (по 10 записів).
  - Публічний перегляд детальної інформації про оголошення за ID.
  - Створення оголошення (тільки для авторизованих користувачів).
  - Редагування та видалення оголошення (з обов'язковою перевіркою права власності / ownership).

---

## 🛠 Технологічний стек

- **Mова:** TypeScript (Node.js)
- **Фреймворк:** Express.js
- **ORM:** Prisma
- **База даних:** PostgreSQL (або SQLite / MySQL залежно від конфігурації)
- **Валідація:** Zod
- **Автентифікація:** JWT (jsonwebtoken), bcrypt
- **Документація:** Swagger UI / OpenAPI (`@asteasolutions/zod-to-openapi`)

---

## 📁 Структура проєкту

```text
goit-backend-hw-02/
├── prisma/
│   ├── schema.prisma          # Схема бази даних Prisma (User, RefreshToken, Announcement)
│   └── client.ts              # Ініціалізація екземпляра PrismaClient
├── src/
│   ├── __tests__/
│       ├── auth.test.ts                # Тестування автентифікації
│   │   └── announcements.tests.ts      # Тестування оголошень
│   ├── controllers/
│   │   ├── auth.controller.ts          # Контролер автентифікації
│   │   └── announcements.controller.ts # Контролер оголошень
│   ├── middleware/
│   │   ├── authenticate.ts             # Middleware для перевірки JWT
│   │   └── validate.ts                 # Middleware для валідації body/query/params за допомогою Zod
│   ├── routes/
│   │   ├── auth.routes.ts              # Маршрути автентифікації
│   │   └── announcements.routes.ts     # Маршрути оголошень
│   ├── validators/
│   │   ├── auth.validator.ts           # Zod-схеми для auth
│   │   └── announcements.validator.ts  # Zod-схеми для оголошень
│   ├── openapi.ts                      # Налаштування та генерація OpenAPI специфікації
│   └── index.ts                        # Точка входу (запуск сервера)
├── app.ts                              # Конфігурація Express застосунку та роутингу
├── .env.example                        # Приклад змінних середовища
├── package.json
└── tsconfig.json
```

---

## ⚙️ Налаштування та запуск

### 1. Клонування репозиторію та встановлення залежностей

```bash
git clone goit-backend-hw-02
cd goit-backend-hw-02
npm install
```

### 2. Змінні середовища (`.env`)

Створіть файл `.env` у корені проєкту та вкажіть відповідні значення:

```env
PORT=3000
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=announcements_db
POSTGRES_PORT=5432
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/announcements_db?schema=public"
JWT_SECRET="super_secret_jwt_key_here"
```

### 3. Міграції бази даних та генерація Prisma Client

```bash
npm install -D prisma@6 typescript tsx @types/node
npm install @prisma/client@6 @prisma/adapter-pg dotenv
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Запуск у режимі розробки

Для запуску сервера окремо від бази даних PostgreSQL:

```bash
npm run dev
```

### 5. Швидкий запуск через Docker Compose

Для запуску сервера разом із базою даних PostgreSQL в ізольованих контейнерах виконати:

```bash
docker compose up --build
```

Сервер буде доступний за адресою: `http://localhost:3000`

---

## 📖 Swagger / OpenAPI Документація

Інтерактивна документація API доступна після запуску сервера за адресою:  
👉 **`http://localhost:3000/docs`**

---

## 📌 Маршрути API

### **Auth маршрути (`/auth`)**

| Метод  | Маршрут          | Доступ    | Опис                                        |
| :----- | :--------------- | :-------- | :------------------------------------------ |
| `POST` | `/auth/register` | Публічний | Реєстрація нового користувача               |
| `POST` | `/auth/login`    | Публічний | Вхід та отримання токенів                   |
| `POST` | `/auth/refresh`  | Публічний | Оновлення access токена через refresh token |
| `POST` | `/auth/logout`   | Захищений | Вихід (інвалідація refresh токена)          |
| `GET`  | `/auth/me`       | Захищений | Отримання профілю поточного користувача     |

### **Маршрути оголошень (`/announcements`)**

| Метод    | Маршрут              | Доступ    | Опис                                                                      |
| :------- | :------------------- | :-------- | :------------------------------------------------------------------------ |
| `GET`    | `/announcements`     | Публічний | Отримання списку оголошень (`?search=`, `?sort=newest\|oldest`, `?page=`) |
| `GET`    | `/announcements/:id` | Публічний | Отримання оголошення за ID                                                |
| `POST`   | `/announcements`     | Захищений | Створення нового оголошення                                               |
| `PATCH`  | `/announcements/:id` | Захищений | Оновлення оголошення (власник)                                            |
| `DELETE` | `/announcements/:id` | Захищений | Видалення оголошення (власник)                                            |

---

## 📝 Правила валідації

### **Реєстрація (`POST /auth/register`)**

- `username`: рядок, 3-30 символів (унікальний)
- `email`: коректний email (унікальний)
- `password`: рядок, мінімум 6 символів
- `name`: рядок, мінімум 2 символів

### **Створення оголошення (`POST /announcements`)**

- `title`: рядок, 5-50 символів
- `description`: рядок, мінімум 10 символів
- `price`: число, більше 0
- `category`: одне з `sale`, `service`, `job`, `other`

## Тестування

### **Створення тестових кейсів**

- [тести](src/__tests__/)
