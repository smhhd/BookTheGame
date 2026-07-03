# Book The Game Database Files

این پوشه شامل خروجی‌های نهایی طراحی دیتابیس پروژه رزرو و خرید بلیط مسابقات ورزشی است.

## فایل‌ها

- `erd_mermaid.md`: نمودار ERD با Mermaid
- `relational_model.md`: مدل رابطه‌ای نهایی
- `create_db.sql`: ساخت schema، جدول‌ها، کلیدها، constraintها و foreign keyها
- `indexes.sql`: ایندکس‌ها و unique indexهای تحلیلی/کنترلی
- `seed_base.sql`: داده‌های پایه لازم برای roleها، نوع ورزش، رده بلیط، دسته گزارش و امکانات

## ترتیب اجرا

```bash
psql -U <user> -d <database> -f create_db.sql
psql -U <user> -d <database> -f indexes.sql
psql -U <user> -d <database> -f seed_base.sql
```
