# Book The Game — Phase 3 Backend

بک‌اند REST سامانه رزرو بلیط مسابقات ورزشی با Node.js، TypeScript،
Express، PostgreSQL و Redis. تمام SQLها مستقیم و پارامتری هستند و هیچ ORM
استفاده نشده است.

## فناوری و معماری

لایه‌ها در `src/routes`، `controllers`، `services` و `repositories` جدا هستند.
Validation با Zod، احراز هویت با JWT، هش رمز با bcryptjs، امنیت HTTP با Helmet
و محدودسازی Auth با express-rate-limit انجام می‌شود. Redis فقط برای OTP و
Cache-Aside است؛ قطعی Redis خواندن داده‌های عمومی از PostgreSQL را متوقف
نمی‌کند، اما OTP تا بازگشت Redis با 503 پاسخ می‌دهد.

## تطبیق با Schema واقعی

- نقش‌های واقعی: `spectator` و `support`، نه `CUSTOMER/ADMIN`.
- هر `tickets` یک صندلی مشخص است؛ بنابراین رزرو ورودی `ticketIds` دارد و ظرفیت
  هر رکورد صفر یا یک است.
- پرداخت متعلق به `orders` است. `POST /api/payments` یک `reservationId`
  می‌گیرد، سفارش آن را پیدا می‌کند و مبلغ تمام آیتم‌های pending سفارش را از
  دیتابیس محاسبه می‌کند.
- وضعیت‌های معتبر دقیقاً از CHECKهای Schema استفاده شده‌اند.
- سیاست جریمه از `cancellation_policies` و `cancellation_policy_rules` خوانده
  می‌شود و Refund در `refunds` ثبت می‌گردد.
- Schema اولیه گزارش مستقیم پرداخت را نداشت. Migration غیرمخرب
  `sql/migrations/001_add_payment_reports.sql` ستون `payment_id`، FK و CHECK
  دقیقاً یک موضوع گزارش را اضافه می‌کند.
- Migration افزایشی `002_phase3_completeness.sql` تاریخ تولد اختیاری، موجودی
  کیف پول و پاسخ متنی پشتیبان را اضافه می‌کند. جدول `refunds` منبع حقیقت
  استرداد باقی می‌ماند و اعتبار کیف پول در همان تراکنش افزایش می‌یابد.
- جدول Audit Log در Schema وجود ندارد و چون اختیاری است به طراحی تحمیل نشده است.

## ساختار

```text
src/
  config/ controllers/ docs/ jobs/ middlewares/
  repositories/ routes/ services/ types/ utils/ validators/
tests/
  unit/ integration/ concurrency/
sql/migrations/
postman/
docs/
```

## پیش‌نیاز و نصب محلی

Node.js 20+، PostgreSQL 14+ با extension `btree_gist` و Redis 7+ لازم است.

```bash
npm install
copy .env.example .env
```

Secretهای نمونه را حتماً عوض کنید. `.env` توسط Git نادیده گرفته می‌شود.

## ایجاد و Seed دیتابیس

```bash
createdb -U postgres book_the_game
psql -U postgres -d book_the_game -f create_db.sql
psql -U postgres -d book_the_game -f indexes.sql
psql -U postgres -d book_the_game -f sample_data.sql
psql -U postgres -d book_the_game -f stored_procedures.sql
psql -U postgres -d book_the_game -f sql/migrations/001_add_payment_reports.sql
psql -U postgres -d book_the_game -f sql/migrations/002_phase3_completeness.sql
```

`create_db.sql` مخرب است و جدول‌های Schema را Drop/Recreate می‌کند؛ فقط برای
ساخت دیتابیس تازه اجرا شود. Migration فاز سوم مخرب نیست.

داده نمونهٔ فاز دوم رمزهای واقعی bcrypt ندارد؛ برای Login باید با Signup کاربر
جدید بسازید یا Hashهای نمونه را با Hash معتبر جایگزین کنید. OTP مستقل از
password_hash است.

## اجرا

PostgreSQL و Redis را اجرا کنید، سپس:

```bash
npm run dev
npm run build
npm start
```

Job انقضا همراه سرور اجرا می‌شود. اجرای یک Batch مستقل:

```bash
npm run job:expire
```

Swagger در `http://localhost:3000/api/docs` و Health در `/health` است.

## Docker

```bash
docker compose up --build
```

Compose در اولین ساخت Volume، Schema، Index، Sample، Function و Migration را
به ترتیب اجرا می‌کند. برای بازسازی کامل دادهٔ نمونه باید Volume PostgreSQL را
با آگاهی از حذف داده پاک کنید.

## Endpointها

| Method | Route | دسترسی | مسئولیت |
|---|---|---|---|
| POST | `/api/auth/signup` | عمومی | ثبت‌نام و JWT |
| POST | `/api/auth/otp/request` | عمومی | ساخت و ارسال آزمایشی OTP |
| POST | `/api/auth/otp/verify` | عمومی | بررسی OTP و JWT |
| GET/PATCH | `/api/users/me` | کاربر | پروفایل جاری |
| GET | `/api/cities` | عمومی | شهرها |
| GET | `/api/venues?cityId=` | عمومی | محل‌ها |
| GET | `/api/tickets` | عمومی | جستجو |
| GET | `/api/tickets/:ticketId` | عمومی | جزئیات |
| POST | `/api/reservations` | کاربر | رزرو موقت صندلی‌ها |
| GET | `/api/reservations/active` | کاربر | رزرو فعال |
| GET | `/api/reservations/history` | کاربر | تاریخچه |
| POST | `/api/payments` | کاربر | پرداخت محلی سفارش |
| GET | `/api/reservations/:id/cancellation-penalty` | مالک/پشتیبان | پیش‌نمایش جریمه |
| POST | `/api/reservations/:id/cancel` | مالک/پشتیبان | کنسلی و Refund |
| POST | `/api/reports` | کاربر | گزارش مشکل |
| GET | `/api/reports/my` | کاربر | گزارش‌های من |
| GET | `/api/admin/reports[/:id]` | پشتیبان | بررسی گزارش |
| PATCH | `/api/admin/reports/:id/status` | پشتیبان | وضعیت گزارش |
| GET | `/api/admin/reservations[/:id]` | پشتیبان | بررسی رزرو |
| PATCH | `/api/admin/reservations/:id/status` | پشتیبان | وضعیت رزرو |
| PATCH | `/api/admin/reservations/:id/ticket` | پشتیبان | تغییر بلیت رزرو با `ticketId` |
| GET | `/api/admin/payments/suspicious` | پشتیبان | پرداخت مشکوک |

فیلترهای Tickets: `sportTypeId`, `homeTeamId`, `awayTeamId`, `cityId`,
`venueId`, `categoryId`, `startDate`, `endDate`, `minPrice`, `maxPrice`,
`remainingOnly`, `sortBy`, `sortOrder`, `page`, `limit`. تاریخ‌ها باید ISO-8601
همراه offset باشند. Sortهای مجاز: `matchDate`, `price`, `createdAt`,
`ticketId`.

نمونه:

```json
POST /api/reservations
Authorization: Bearer <token>
{"ticketIds":[4,7]}
```

```json
POST /api/payments
Authorization: Bearer <token>
{"reservationId":19,"method":"CARD","simulateStatus":"SUCCESS"}
```

`simulateStatus=FAILED` فقط در Development/Test مجاز است. در Production مسیر
همیشه نتیجه واقعی Provider محلی فعلی (`SUCCESS`) را می‌پذیرد؛ اتصال بانک واقعی
جزو این فاز نیست.

## قالب پاسخ

```json
{"success":true,"message":"Operation completed successfully","data":{}}
```

```json
{"success":false,"message":"Human-readable message","error":{"code":"CODE","details":[]}}
```

## OTP و امنیت

کلیدها `otp:email:<normalized>` یا `otp:phone:<normalized>` هستند. خود کد ذخیره
نمی‌شود؛ HMAC آن همراه شمارنده تلاش و TTL ذخیره می‌گردد. Rate limit توزیع‌شده
در Redis و Rate limit HTTP هر دو فعال‌اند. پاسخ Request وجود حساب را افشا
نمی‌کند. فقط با `NODE_ENV!=production` و `EXPOSE_DEV_OTP=true` کد در پاسخ
آزمایشی می‌آید؛ هیچ OTP یا رمز عبوری Log نمی‌شود.

## تراکنش و همروندی

رزرو، پرداخت، کنسلی، Job انقضا و تغییر حساس پشتیبان Client اختصاصی Pool،
`BEGIN/COMMIT/ROLLBACK/finally release` دارند. رزرو رکورد `tickets` را
`FOR UPDATE` قفل می‌کند؛ ایندکس شرطی `uq_active_reservation_per_ticket` نیز
دفاع دوم است. پرداخت و Job ابتدا order و سپس reservation/ticket را با ترتیب
یکسان قفل می‌کنند. Job از `FOR UPDATE SKIP LOCKED` و Batch محدود استفاده
می‌کند و فقط وضعیت pending را آزاد می‌کند، پس اجرای دوباره امن است.

## Cache

Cities، Venues، Profile، Search و Ticket Details با Cache-Aside و TTLهای Environment
کش می‌شوند. کلید Search از JSON مرتب‌شده و SHA-256 ساخته می‌شود. هر تغییر
ظرفیت فقط پس از Commit شمارنده `cache:tickets:version` را افزایش می‌دهد؛ Cache
قدیمی دیگر خوانده نمی‌شود و با TTL حذف می‌شود. پروفایل حساس کش نشده است.

## تست

```bash
npm run typecheck
npm test
npm run test:integration
```

تست همروندی واقعی نیازمند یک بلیط available برای مسابقه آینده است:

```bash
set CONCURRENCY_TICKET_ID=4
set CONCURRENCY_USER_ID=1
npm run test:concurrency
```

Script دو Promise هم‌زمان می‌فرستد و سپس Assert می‌کند دقیقاً یکی موفق و فقط
یک reservation فعال موجود باشد. اجرای Integration کامل به PostgreSQL و Redis
اختصاصی Test نیاز دارد؛ از دیتابیس Production استفاده نکنید.

## Postman

`postman/BookTheGame.postman_collection.json` را Import و `baseUrl` را تنظیم
کنید. اسکریپت Signup/OTP Verify توکن پاسخ را خودکار در متغیر `token` ذخیره
می‌کند. شناسه‌های نمونه باید با دیتابیس شما هماهنگ شوند.

## محدودیت‌ها و فاز چهارم

- Email/SMS و درگاه بانکی Provider آزمایشی و قابل تعویض دارند.
- Schema برای ورزش‌های مختلف ستون اختصاصی جدا ندارد؛ پاسخ `sportSpecificDetails`
  فقط از اطلاعات واقعی صندلی، نوع محل و امکانات موجود ساخته می‌شود و داده‌ای
  حدس زده نمی‌شود.
- Sample matchها تاریخ ثابت دارند و با گذشت زمان برای رزرو مناسب نیستند.
- Audit Log پیشنهاد می‌شود اما چون جدول مناسب وجود نداشت اضافه نشده است.
- Elasticsearch و UI عمداً مربوط به فاز چهارم‌اند. پیشنهاد بعدی Outbox برای
  Sync مطمئن PostgreSQL/Elasticsearch و Autocomplete است.

## پیشنهاد Git

Branch پیشنهادی: `phase-3-backend`. تاریخچه Rewrite نشده است. تقسیم Commit:

1. `feat: initialize backend and database connections`
2. `feat: implement otp signup and jwt authentication`
3. `feat: implement ticket search and redis caching`
4. `feat: implement transactional reservation and expiration flow`
5. `feat: implement payment cancellation and refund workflow`
6. `feat: implement reports and admin endpoints`
7. `test: add integration and concurrency tests`
8. `docs: add postman openapi and phase three documentation`
