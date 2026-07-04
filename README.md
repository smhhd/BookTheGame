# Book The Game Database Files

این پوشه شامل خروجی‌های نهایی طراحی دیتابیس پروژه رزرو و خرید بلیط مسابقات ورزشی است.

## فایل‌ها

- `erd_mermaid.md`: نمودار ERD با Mermaid
- `relational_model.md`: مدل رابطه‌ای نهایی
- `create_db.sql`: ساخت schema، جدول‌ها، کلیدها، constraintها و foreign keyها
- `indexes.sql`: ایندکس‌ها و unique indexهای تحلیلی/کنترلی
- `sample_data.sql`: داده نمونه برای تست، با حداقل ۱۰ رکورد برای جدول‌های اصلی و lookupهای قابل گسترش
- `analytical_queries.sql`: پاسخ ۲۲ کوئری اطلاعاتی و تحلیلی پروژه
- `stored_procedures.sql`: ۸ تابع ذخیره‌شده PostgreSQL برای عملیات پرتکرار پروژه
- `phase2_full.sql`: فایل یکپارچه شامل schema، index، sample data، queries و stored procedures

## ترتیب اجرا

```bash
psql -U <user> -d <database> -f create_db.sql
psql -U <user> -d <database> -f indexes.sql
psql -U <user> -d <database> -f sample_data.sql
psql -U <user> -d <database> -f stored_procedures.sql
```

## تعریف خرید موفق در کوئری‌ها

در این طراحی، خرید موفق یعنی:

```sql
payments.status IN ('success', 'refunded')
AND reservations.status IN ('paid', 'cancelled')
```

چون پرداخت روی `orders` انجام می‌شود و هر order می‌تواند چند reservation داشته باشد.

## نکته درباره داده نمونه

جدول `roles` فقط دو مقدار معتبر دارد: `spectator` و `support`. به همین دلیل عمداً ۱۰ رکورد ندارد، چون Constraint طراحی اجازه نقش اضافه نمی‌دهد. سایر جدول‌های اصلی و lookupهای قابل گسترش با داده کافی پر شده‌اند.
