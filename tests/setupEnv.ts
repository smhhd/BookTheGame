process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://test:test@127.0.0.1:5432/book_the_game_test";
process.env.REDIS_URL = process.env.TEST_REDIS_URL ?? "redis://127.0.0.1:6379/15";
process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";
process.env.OTP_HASH_SECRET = "test-only-otp-secret-at-least-32-characters";
