# Announcements Board API (Production Ready)

Цей проєкт є оновленою та покращеною версією REST API для ![дошки оголошень](https://github.com/martoff1980/goit-backendjs-hw-02) (опис [HW2](README_PREV.md)), підготовленою до використання в
production-середовищі. Застосунок побудовано на Node.js, Express, Prisma ORM, PostgreSQL та TypeScript із підтримкою JWT-автентифікації, автоматичного логування, завантаження мультимедіа та базового
тестування.

## 📁 Оновлена структура проєкту

```text
goit-backend-hw-03/
├── prisma/
│   ├── schema.prisma          # Схема бази даних Prisma (User, RefreshToken, Announcement)
│   └── client.ts              # Ініціалізація екземпляра PrismaClient
├── src/
│   ├── __tests__/
│   │   ├── auth.test.ts                # Тестування автентифікації
│   │   └── announcements.tests.ts      # Тестування оголошень
│   ├── controllers/
│   │   ├── auth.controller.ts          # Контролер автентифікації
│   │   └── announcements.controller.ts # Контролер оголошень
│   ├── middleware/
│   │   ├── authenticate.ts             # Middleware для перевірки JWT
│   │   ├── upload.ts                   # Middleware для тимчасового збереження файлів у uploads/
│   │   └── validate.ts                 # Middleware для валідації body/query/params за допомогою Zod
│   ├── routes/
│   │   ├── auth.routes.ts              # Маршрути автентифікації
│   │   └── announcements.routes.ts     # Маршрути оголошень
│   ├── validators/
│   │   ├── auth.validator.ts           # Zod-схеми для auth
│   │   └── announcements.validator.ts  # Zod-схеми для оголошень
│   ├── utils/
│   │   └── cloudinary.ts               # Вивантаження фото в хмарне сховище
│   │
│   ├── openapi.ts                      # Налаштування та генерація OpenAPI специфікації
│   ├── logger.ts                       # Налаштування логування
│   └── index.ts                        # Точка входу (запуск сервера)
├── app.ts                              # Конфігурація Express застосунку та роутингу
├── .env.example                        # Приклад змінних середовища
├── package.json
└── tsconfig.json
```

## 🚀 Нові можливості та покращення

- **Базова безпека**:

  - **Helmet**: Встановлення безпечних HTTP-заголовків за замовчуванням.

  - **CORS**: Обмеження запитів за допомогою змінної оточення `ALLOWED_ORIGINS`.

  - **Rate Limiting**: Обмеження кількості запитів на авторизаційні маршрути (`/auth/\*`) — не більше 10 запитів за 15 хвилин з одного IP.

- **Логування (`pino` & `pino-http`)**:

  - Централізований модуль логування `src/logger.ts`.

  - Автоматичне логування всіх HTTP-запитів.

  - Детальне логування подій у контролерах (реєстрація, вхід, створення оголошень, завантаження фото).

- **Завантаження фото через Cloudinary**:

  - Підтримка multipart/form-data у маршрутах створення та оновлення оголошень (`POST /announcements` та `PATCH /announcements/:id`).

  - Тимчасове збереження у локальній папці `uploads/` за допомогою `multer` із гарантованим видаленням локального файлу після завантаження на Cloudinary.

- **Тестування (`Vitest`)**:

  - Налаштований тестовий фреймворк `Vitest` для виконання unit та integration тестів.

## 🛠 Змінні оточення (.env)

Створіть або доповніть файл .env наступними параметрами:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/announcements_db?schema=public"
JWT_SECRET="your_jwt_secret_key"

# CORS
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

## 📦 Встановлення та запуск

**Локальний запуск (Development)**

### 1. Встановіть залежності:

```bash
npm install -D vitest@^3
npm install
npm install multer express-rate-limit
npm install cloudinary helmet
npm install pino pino-pretty pino-http
```

### 2. Застосуйте міграції бази даних:

```bash
npx prisma migrate dev
```

### 3. Запустіть сервер у режимі розробки:

```bash
npm run dev
```

## Запуск у Docker Compose

Для підняття контейнерів із бази даних та додатком:

```bash
docker compose up --build
```

## 🧪 Запуск тестів

Для виконання тестів Vitest запустіть команду:

```bash
npm run test
```

## 📖 Документація OpenAPI / Swagger

Інтерактивна документація API доступна за адресою:

```bash
http://localhost:3000/api-docs
```
