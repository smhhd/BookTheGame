# Book The Game — Phase 3 Backend

بک‌اند REST سامانه رزرو بلیط مسابقات ورزشی با Node.js، TypeScript،
Express، PostgreSQL و Redis. تمام SQLها مستقیم و پارامتری هستند و هیچ ORM
استفاده نشده است.

## فناوری و معماری

لایه‌ها در `src/routes`، `controllers`، `services` و `repositories` جدا هستند.
Validation با Zod، احراز هویت با JWT، هش رمز با bcryptjs، امنیت HTTP با Helmet
و محدودسازی Auth با express-rate-limit انجام می‌شود. Redis فقط برای OTP و
Cache-Aside استفاده می‌شود. خطاهای عملیاتی Cache باعث شکست عملیات اصلی
PostgreSQL نمی‌شوند؛ بااین‌حال OTP به Redis وابسته است و اتصال اولیه Redis طبق
سیاست reconnect کلاینت تا زمان برقراری دوباره تلاش می‌شود.

## تطبیق با Schema واقعی

- نقش‌های واقعی: `spectator` و `support`، نه `CUSTOMER/ADMIN`.
- هر `tickets` یک صندلی مشخص است؛ بنابراین رزرو ورودی `ticketIds` دارد و ظرفیت
  هر رکورد صفر یا یک است.
- پرداخت متعلق به `orders` است. `POST /api/payments` یک `reservationId`
  می‌گیرد، سفارش آن را پیدا می‌کند و مبلغ تمام آیتم‌های pending سفارش را از
  دیتابیس محاسبه می‌کند. پرداخت موفق با کیف پول، موجودی را در همان تراکنش و
  به‌صورت اتمیک بررسی و کسر می‌کند.
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

## Endpointها، ورودی‌ها و خروجی‌ها

همه مسیرهای محافظت‌شده Header از نوع `Authorization: Bearer <token>` می‌خواهند.
در جدول زیر، «خروجی» محتوای فیلد `data` در قالب پاسخ استاندارد است؛ علامت `?`
یعنی پارامتر اختیاری است.

| Method و Route | دسترسی | ورودی | خروجی `data` | موفقیت |
|---|---|---|---|---|
| `GET /health` | عمومی | ندارد | `{}` | `200` |
| `POST /api/auth/signup` | عمومی | Body: `firstName`, `lastName`, `password` و حداقل یکی از `email`/`phone`؛ `cityId?` | `user` عمومی بدون هش رمز، `token` | `201` |
| `POST /api/auth/otp/request` | عمومی | Body: `identifier` (ایمیل یا تلفن) | `expiresInSeconds` و فقط در محیط مجاز `devOtp` | `200` |
| `POST /api/auth/otp/verify` | عمومی | Body: `identifier`, `otp` شش‌رقمی | `user` عمومی، `token` | `200` |
| `GET /api/users/me` | کاربر | ندارد | پروفایل شامل شناسه، نقش، تماس، شهر، تصویر، تولد، کیف پول و وضعیت | `200` |
| `PATCH /api/users/me` | کاربر | Body: حداقل یکی از `firstName`, `lastName`, `email`, `phone`, `cityId`, `profileImageUrl`, `birthDate` | پروفایل به‌روزشده | `200` |
| `GET /api/cities` | عمومی | ندارد | `items[]` شامل `city_id`, `name`, `province_id`, `province_name` و `cacheHit` | `200` |
| `GET /api/venues` | عمومی | Query: `cityId?` | `items[]` شامل شناسه، شهر، نام، آدرس و نوع محل؛ `cacheHit` | `200` |
| `GET /api/tickets` | عمومی | Queryهای جستجو و صفحه‌بندیِ زیر جدول | `items[]` بلیت‌ها، `pagination` و در Development مقدار `cacheHit` | `200` |
| `GET /api/tickets/:ticketId` | عمومی | Path: `ticketId` | مشخصات بلیت، مسابقه، تیم‌ها، محل، صندلی، امکانات، ظرفیت و `sportSpecificDetails` | `200` |
| `POST /api/reservations` | کاربر | Body: `ticketIds` یکتا (۱ تا ۱۰ شناسه) | `orderId`, `reservedUntil`, `reservations[]`, `updatedTicketCount` | `201` |
| `GET /api/reservations/active` | کاربر | ندارد | آرایه رزروهای pending و منقضی‌نشده با بلیت، مسابقه و صندلی | `200` |
| `GET /api/reservations/history` | کاربر | Query: `status?`, `page?`, `limit?` | `items[]` تاریخچه و `pagination` | `200` |
| `POST /api/payments` | کاربر | Body: `reservationId`, `method`؛ `simulateStatus?` | رکورد پرداخت شامل شناسه‌ها، مبلغ، روش، وضعیت، زمان و کد تراکنش | `201` |
| `GET /api/reservations/:reservationId/cancellation-penalty` | مالک/پشتیبان | Path: `reservationId` | مبلغ اصلی، درصد/مبلغ جریمه، مبلغ قابل استرداد و شناسه Policy/Rule | `200` |
| `POST /api/reservations/:reservationId/cancel` | مالک/پشتیبان | Path: `reservationId`؛ Body: `reason?` | `requestId`, `penalty`, `refund` و `alreadyCancelled` | `200` |
| `POST /api/reports` | کاربر | Body: `categoryId`, `description` و دقیقاً یکی از `ticketId`/`reservationId`/`paymentId` | `report_id`, `status`, `created_at` | `201` |
| `GET /api/reports/my` | کاربر | ندارد | آرایه گزارش‌ها، موضوع، دسته، وضعیت و پاسخ پشتیبان | `200` |
| `GET /api/admin/reports` | پشتیبان | Query: `status?`, `page?`, `limit?` | `items[]` گزارش‌ها و اطلاعات کاربر، `pagination` | `200` |
| `GET /api/admin/reports/:id` | پشتیبان | Path: `id` | جزئیات کامل گزارش، دسته و اطلاعات کاربر | `200` |
| `PATCH /api/admin/reports/:id/status` | پشتیبان | Path: `id`؛ Body: `status`, `response?` | گزارش به‌روزشده و اطلاعات بررسی | `200` |
| `GET /api/admin/reservations` | پشتیبان | Query: `status?`, `page?`, `limit?` | `items[]` رزروها و اطلاعات کاربر/مسابقه، `pagination` | `200` |
| `GET /api/admin/reservations/:id` | پشتیبان | Path: `id` | جزئیات رزرو، بلیت، مسابقه، محل و پرداخت | `200` |
| `PATCH /api/admin/reservations/:id/status` | پشتیبان | Path: `id`؛ Body: `status` از `paid`, `cancelled`, `expired` | نتیجه تغییر وضعیت؛ در کنسلی شامل جریمه و Refund | `200` |
| `PATCH /api/admin/reservations/:id/ticket` | پشتیبان | Path: `id`؛ Body: `ticketId` از همان مسابقه | شناسه رزرو، بلیت قبلی/جدید، قیمت، وضعیت و بررسی‌کننده | `200` |
| `GET /api/admin/payments/suspicious` | پشتیبان | ندارد | آرایه پرداخت‌های مشکوک با مبلغ مورد انتظار، تعداد تلاش و `reasons[]` | `200` |

Query جستجوی بلیت: `sportTypeId?`, `homeTeamId?`, `awayTeamId?`, `cityId?`,
`venueId?`, `categoryId?`, `startDate?`, `endDate?`, `minPrice?`, `maxPrice?`,
`remainingOnly?` (پیش‌فرض `true`)، `sortBy?`, `sortOrder?`, `page?`, `limit?`.
تاریخ‌ها ISO-8601 همراه offset هستند؛ `sortBy` یکی از `matchDate`, `price`,
`createdAt`, `ticketId` و `sortOrder` یکی از `asc`, `desc` است. `status` تاریخچه
و رزرو ادمین یکی از `pending`, `paid`, `cancelled`, `expired` و `status` گزارش
یکی از `pending`, `reviewed`, `rejected` است. صفحه‌بندی به‌طور پیش‌فرض
`page=1&limit=20` و حداکثر `limit=100` دارد.

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

در روش `wallet`، کمبود موجودی با خطای `INSUFFICIENT_WALLET_BALANCE` پاسخ داده
می‌شود و هیچ پرداختی ثبت یا مبلغی کسر نمی‌شود. تغییر بلیت توسط پشتیبان فقط برای
رزرو pending، پیش از انقضا و به یک بلیت available از همان مسابقه مجاز است.

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
قدیمی دیگر خوانده نمی‌شود و با TTL حذف می‌شود. خروجی پروفایل بدون
`password_hash` کش می‌شود و پس از ویرایش پروفایل، پرداخت کیف پول یا Refund
کلید آن حذف می‌گردد.

## تست

```bash
npm run typecheck
npm test
npm run test:integration
```

در وضعیت فعلی ۷ Suite و ۱۷ تست خودکار وجود دارد؛ تست‌های رگرسیون پرداخت کیف
پول، پاک‌سازی Cache پس از Refund، پاسخ پشتیبان و تغییر بلیت رزرو را نیز پوشش
می‌دهند.

تست همروندی واقعی نیازمند یک بلیط available برای مسابقه آینده است:

```bash
set CONCURRENCY_TICKET_ID=123
set CONCURRENCY_USER_ID=1
npm run test:concurrency
```

شناسه‌های `123` و `1` نمونه‌اند و باید با بلیت آینده و کاربر موجود جایگزین شوند.
Script دو Promise هم‌زمان می‌فرستد و سپس Assert می‌کند دقیقاً یکی موفق و فقط
یک reservation فعال موجود باشد. اجرای Integration کامل به PostgreSQL و Redis
اختصاصی Test نیاز دارد؛ از دیتابیس Production استفاده نکنید.

## Postman

`postman/BookTheGame.postman_collection.json` را Import و `baseUrl` را تنظیم
کنید. Collection Runner را از اولین درخواست (`Health`) اجرا کنید. ایمیل تست
یکتا ساخته می‌شود، OTP آزمایشی و JWT به‌صورت خودکار بین درخواست‌ها انتقال
می‌یابند و سه Assertion عمومی برای JSON بودن، قالب استاندارد پاسخ و نبود خطای
پردازش‌نشدهٔ `5xx` روی تک‌تک درخواست‌ها اجرا می‌شود.

Response واقعی همه درخواست‌های اجراشده، همراه Method، URL و Status، در متغیر
Collection به نام `phase3ResponseLog` ثبت می‌شود؛ مقادیر حساس `token` و
`devOtp` در این گزارش با `<redacted>` جایگزین می‌شوند. پس از Run، این متغیر را
از تب Variables می‌توان مشاهده یا همراه Collection خروجی گرفت. برای مسیرهای
`/api/admin` ابتدا متغیر `supportToken` را با JWT یک کاربر `support` پر کنید و
شناسه‌های `ticketId`، `reservationId` و `reportId` را با دادهٔ جاری هماهنگ
کنید. دریافت پاسخ خطای کنترل‌شده (مانند `4xx`) نیز ثبت می‌شود، اما برای سناریوی
موفق باید پیش‌شرط دادهٔ همان درخواست برقرار باشد.

## محدودیت‌ها و فاز چهارم

- Email/SMS و درگاه بانکی Provider آزمایشی و قابل تعویض دارند.
- در قطعی اولیه Redis، reconnect کلاینت ممکن است درخواست وابسته به Cache یا OTP
  را تا زمان برقراری اتصال معطل نگه دارد.
- Schema برای ورزش‌های مختلف ستون اختصاصی جدا ندارد؛ پاسخ `sportSpecificDetails`
  فقط از اطلاعات واقعی صندلی، نوع محل و امکانات موجود ساخته می‌شود و داده‌ای
  حدس زده نمی‌شود.
- Sample matchها تاریخ ثابت دارند و با گذشت زمان برای رزرو مناسب نیستند.
- Audit Log پیشنهاد می‌شود اما چون جدول مناسب وجود نداشت اضافه نشده است.
- Elasticsearch و UI عمداً مربوط به فاز چهارم‌اند. پیشنهاد بعدی Outbox برای
  Sync مطمئن PostgreSQL/Elasticsearch و Autocomplete است.

## وضعیت Git

فاز سوم روی Branch مستقل `phase-3-backend` و در پنج Commit معنادار شامل
راه‌اندازی، احراز هویت و جستجو، رزرو و پرداخت، مدیریت پشتیبان، و تست و مستندات
ثبت شده است.
