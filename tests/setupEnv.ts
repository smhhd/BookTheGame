process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://test:test@127.0.0.1:5432/book_the_game_test";
process.env.REDIS_URL = process.env.TEST_REDIS_URL ?? "redis://127.0.0.1:6379/15";
process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";
process.env.OTP_HASH_SECRET = "test-only-otp-secret-at-least-32-characters";
process.env.SMTP_HOST = "smtp.test.invalid";
process.env.SMTP_PORT = "587";
process.env.SMTP_SECURE = "false";
process.env.SMTP_USER = "sender@example.com";
process.env.SMTP_PASS = "test-only-smtp-password";
process.env.SMTP_FROM_NAME = "Book The Game";
process.env.SMTP_FROM_EMAIL = "sender@example.com";
