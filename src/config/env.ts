import "dotenv/config";
import { z } from "zod";

const booleanString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  REDIS_URL: z.string().min(1),
  ELASTICSEARCH_NODE: z.string().url().default("http://localhost:9200"),
  ELASTICSEARCH_USERNAME: z.string().optional(),
  ELASTICSEARCH_PASSWORD: z.string().optional(),
  ELASTICSEARCH_INDEX: z.string().regex(/^[a-z0-9_-]+$/).default("book_the_game_tickets_v1"),
  ELASTICSEARCH_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(100).max(30000).default(2000),
  ELASTICSEARCH_REINDEX_BATCH_SIZE: z.coerce.number().int().min(1).max(5000).default(500),
  SEARCH_FALLBACK_TO_POSTGRES: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("1h"),
  OTP_HASH_SECRET: z.string().min(32),
  OTP_TTL_SECONDS: z.coerce.number().int().min(60).max(1800).default(300),
  OTP_REQUEST_WINDOW_SECONDS: z.coerce.number().int().min(60).default(900),
  OTP_REQUEST_MAX: z.coerce.number().int().min(1).default(5),
  OTP_VERIFY_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(5),
  EXPOSE_DEV_OTP: booleanString,
  RESERVATION_TTL_MINUTES: z.coerce.number().int().min(1).max(60).default(10),
  EXPIRATION_JOB_CRON: z.string().default("*/1 * * * *"),
  EXPIRATION_BATCH_SIZE: z.coerce.number().int().min(1).max(1000).default(100),
  CACHE_LIST_TTL_SECONDS: z.coerce.number().int().min(1).default(300),
  CACHE_PROFILE_TTL_SECONDS: z.coerce.number().int().min(1).default(120),
  CACHE_TICKET_TTL_SECONDS: z.coerce.number().int().min(1).default(60),
  CACHE_SEARCH_TTL_SECONDS: z.coerce.number().int().min(1).default(30),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  BODY_LIMIT: z.string().default("100kb"),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(30),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info")
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
