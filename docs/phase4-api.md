# APIهای مصرف‌شده در فاز چهارم

Base URL پیش‌فرض `http://localhost:3000` است. همه پاسخ‌ها Envelope زیر دارند:

```json
{ "success": true, "message": "...", "data": {} }
```

خطاها به شکل `{"success":false,"message":"...","error":{"code":"...","details":[]}}`
برمی‌گردند. مسیرهای «کاربر» Header `Authorization: Bearer <JWT>` و مسیرهای
«پشتیبان» JWT دارای نقش `support` می‌خواهند.

## Contract جستجو

`GET /api/tickets` عمومی است. Queryهای پشتیبانی‌شده:

| Query                                                                        | نوع و محدودیت                                              |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `q`                                                                          | متن عمومی، ۱ تا ۲۰۰ نویسه                                  |
| `team`                                                                       | نام یکی از تیم‌ها، ۱ تا ۱۰۰ نویسه                          |
| `sport`                                                                      | نام نوع ورزش، ۱ تا ۱۰۰ نویسه                               |
| `sportTypeId`, `homeTeamId`, `awayTeamId`, `cityId`, `venueId`, `categoryId` | عدد صحیح مثبت                                              |
| `status`                                                                     | `available`, `reserved`, `sold`, `cancelled`               |
| `facility`                                                                   | نام دقیق امکان                                             |
| `startDate`, `endDate`                                                       | ISO-8601 همراه offset                                      |
| `minPrice`, `maxPrice`                                                       | عدد نامنفی                                                 |
| `remainingOnly`                                                              | `true`/`false`؛ پیش‌فرض `true`                             |
| `sortBy`                                                                     | `matchDate`, `price`, `createdAt`, `ticketId`, `relevance` |
| `sortOrder`                                                                  | `asc`/`desc`                                               |
| `page`, `limit`                                                              | صفحه از ۱؛ Limit حداکثر ۱۰۰                                |

```bash
curl "http://localhost:3000/api/tickets?q=Football&cityId=1&minPrice=100000&sortBy=relevance&page=1&limit=20"
```

خروجی `data` شامل `items`, `pagination`, `search.source`, `search.tookMs` و در
Development مقدار `cacheHit` است. خطاهای مهم `400 VALIDATION_ERROR` و، در صورت
خاموش بودن Fallback، `503 SEARCH_UNAVAILABLE` هستند.

## Endpointهای Frontend

| Method و URL                                     | دسترسی       | ورودی اصلی                | خروجی اصلی             | خطاهای مهم                                    |
| ------------------------------------------------ | ------------ | ------------------------- | ---------------------- | --------------------------------------------- |
| `POST /api/auth/signup`                          | عمومی        | اطلاعات نام، تماس و رمز   | کاربر و JWT            | `EMAIL_EXISTS`, `PHONE_EXISTS`                |
| `POST /api/auth/otp/request`                     | عمومی        | `identifier`              | TTL و OTP توسعه        | `OTP_RATE_LIMIT`, `OTP_STORE_UNAVAILABLE`     |
| `POST /api/auth/otp/verify`                      | عمومی        | `identifier`, `otp`       | کاربر و JWT            | `OTP_INVALID_OR_EXPIRED`                      |
| `GET/PATCH /api/users/me`                        | کاربر        | فیلدهای مجاز پروفایل      | پروفایل                | `AUTH_REQUIRED`, `EMAIL_EXISTS`               |
| `GET /api/cities`                                | عمومی        | —                         | شهرها                  | —                                             |
| `GET /api/venues`                                | عمومی        | `cityId?`                 | محل‌ها                 | `VALIDATION_ERROR`                            |
| `GET /api/competitions`                          | عمومی        | —                         | لیگ‌ها/مسابقات         | —                                             |
| `GET /api/competitions/:competitionId/tickets`   | عمومی        | شناسه Path                | بلیت‌های مرتبط         | `VALIDATION_ERROR`                            |
| `GET /api/tickets`                               | عمومی        | Queryهای بالا             | نتایج صفحه‌بندی        | `SEARCH_UNAVAILABLE`                          |
| `GET /api/tickets/:ticketId`                     | عمومی        | شناسه Path                | جزئیات کامل            | `TICKET_NOT_FOUND`                            |
| `POST /api/reservations`                         | کاربر        | `ticketIds[]`             | رزرو و `reservedUntil` | `TICKET_UNAVAILABLE`, `MATCH_NOT_RESERVABLE`  |
| `GET /api/reservations/active`                   | کاربر        | —                         | رزروهای فعال           | `AUTH_REQUIRED`                               |
| `GET /api/reservations/history`                  | کاربر        | `status?`, Pagination     | تاریخچه                | `VALIDATION_ERROR`                            |
| `POST /api/payments`                             | کاربر        | `reservationId`, `method` | پرداخت                 | `ALREADY_PAID`, `INSUFFICIENT_WALLET_BALANCE` |
| `GET /api/reservations/:id/cancellation-penalty` | مالک/پشتیبان | شناسه Path                | جریمه معتبر Server     | `MATCH_ALREADY_STARTED`                       |
| `POST /api/reservations/:id/cancel`              | مالک/پشتیبان | `reason?`                 | کنسلی و Refund         | `NOT_RESERVATION_OWNER`                       |
| `POST /api/reports`                              | کاربر        | دسته، متن و یک موضوع      | گزارش                  | `INVALID_REPORT_SOURCE`                       |
| `GET /api/reports/my`                            | کاربر        | —                         | گزارش‌ها و پاسخ        | —                                             |
| `GET /api/admin/reports`                         | پشتیبان      | وضعیت و Pagination        | گزارش‌ها               | `SUPPORT_REQUIRED`                            |
| `GET /api/admin/reports/:id`                     | پشتیبان      | شناسه                     | جزئیات                 | `REPORT_NOT_FOUND`                            |
| `PATCH /api/admin/reports/:id/status`            | پشتیبان      | وضعیت و پاسخ              | گزارش جدید             | `VALIDATION_ERROR`                            |
| `GET /api/admin/reservations`                    | پشتیبان      | وضعیت و Pagination        | رزروها                 | `SUPPORT_REQUIRED`                            |
| `GET /api/admin/reservations/:id`                | پشتیبان      | شناسه                     | جزئیات                 | `RESERVATION_NOT_FOUND`                       |
| `PATCH /api/admin/reservations/:id/status`       | پشتیبان      | وضعیت                     | نتیجه عملیات           | `INVALID_STATUS_TRANSITION`                   |
| `PATCH /api/admin/reservations/:id/ticket`       | پشتیبان      | `ticketId`                | بلیت جایگزین           | `TICKET_MATCH_MISMATCH`                       |
| `GET /api/admin/payments/suspicious`             | پشتیبان      | —                         | پرداخت‌ها و دلایل      | `SUPPORT_REQUIRED`                            |

نمونه‌های Curl جریان اصلی:

```bash
curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"StrongPass123"}'
curl http://localhost:3000/api/tickets/4
curl -X POST http://localhost:3000/api/reservations -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"ticketIds":[4]}'
curl -X POST http://localhost:3000/api/payments -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"reservationId":19,"method":"CARD","simulateStatus":"SUCCESS"}'
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/reservations/history
curl -X POST http://localhost:3000/api/reservations/19/cancel -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"reason":"Cannot attend"}'
curl -X POST http://localhost:3000/api/reports -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"categoryId":1,"reservationId":19,"description":"Payment issue"}'
curl -H "Authorization: Bearer SUPPORT_TOKEN" http://localhost:3000/api/admin/reports
```

Contract تعاملی کامل در Swagger مسیر `/api/docs` و درخواست‌های آماده در مجموعه
Postman موجود است.
