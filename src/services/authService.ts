import bcrypt from "bcryptjs";
import { createHmac, randomInt } from "node:crypto";
import { redis, connectRedis } from "../config/redis";
import { env } from "../config/env";
import {
  contactExists,
  createUser,
  findUserByIdentifier,
  toPublicUser
} from "../repositories/userRepository";
import { AppError } from "../utils/AppError";
import { issueToken } from "./tokenService";
import { otpNotificationProvider } from "./notificationService";

function normalizeIdentifier(identifier: string): string {
  return identifier.includes("@") ? identifier.toLowerCase() : identifier;
}

function otpNamespace(identifier: string): string {
  return identifier.includes("@") ? "email" : "phone";
}

function otpKey(identifier: string): string {
  const normalized = normalizeIdentifier(identifier);
  return `otp:${otpNamespace(normalized)}:${normalized}`;
}

function hashOtp(identifier: string, otp: string): string {
  return createHmac("sha256", env.OTP_HASH_SECRET)
    .update(`${normalizeIdentifier(identifier)}:${otp}`)
    .digest("hex");
}

// Atomically checks the hash, increments failed attempts while preserving TTL,
// and consumes a successful OTP. This prevents two concurrent verifies from
// using the same one-time code.
export const OTP_VERIFY_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end

local decoded, record = pcall(cjson.decode, raw)
if not decoded or type(record) ~= 'table' then
  redis.call('DEL', KEYS[1])
  return 0
end

local attempts = tonumber(record.attempts) or 0
local max_attempts = tonumber(ARGV[2])
if attempts >= max_attempts then
  redis.call('DEL', KEYS[1])
  return -2
end

if record.hash ~= ARGV[1] then
  attempts = attempts + 1
  if attempts >= max_attempts then
    redis.call('DEL', KEYS[1])
    return -2
  end
  record.attempts = attempts
  redis.call('SET', KEYS[1], cjson.encode(record), 'KEEPTTL')
  return -1
end

redis.call('DEL', KEYS[1])
return 1
`;

export async function signup(input: {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  password: string;
  cityId?: number | null;
}) {
  const email = input.email ?? null;
  const phone = input.phone ?? null;
  const duplicate = await contactExists(email, phone);
  if (duplicate.email) throw new AppError(409, "EMAIL_EXISTS", "Email is already registered");
  if (duplicate.phone) throw new AppError(409, "PHONE_EXISTS", "Phone is already registered");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await createUser({
    firstName: input.firstName,
    lastName: input.lastName,
    email,
    phone,
    passwordHash,
    cityId: input.cityId ?? null
  });
  return {
    user: toPublicUser(user),
    token: issueToken({ userId: user.user_id, role: user.role_name })
  };
}

export async function requestOtp(identifierInput: string) {
  const identifier = normalizeIdentifier(identifierInput);
  if (!(await connectRedis())) {
    throw new AppError(503, "OTP_STORE_UNAVAILABLE", "OTP service is temporarily unavailable");
  }

  const rateKey = `otp:rate:${otpNamespace(identifier)}:${identifier}`;
  const requests = await redis.incr(rateKey);
  if (requests === 1) await redis.expire(rateKey, env.OTP_REQUEST_WINDOW_SECONDS);
  if (requests > env.OTP_REQUEST_MAX) {
    throw new AppError(429, "OTP_RATE_LIMIT", "Too many OTP requests");
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await redis.set(
    otpKey(identifier),
    JSON.stringify({ hash: hashOtp(identifier, code), attempts: 0 }),
    { EX: env.OTP_TTL_SECONDS }
  );

  const user = await findUserByIdentifier(identifier);
  if (user) await otpNotificationProvider.sendOtp(identifier, code);

  return {
    expiresInSeconds: env.OTP_TTL_SECONDS,
    ...(env.NODE_ENV !== "production" && env.EXPOSE_DEV_OTP && user ? { devOtp: code } : {})
  };
}

export async function verifyOtp(identifierInput: string, otp: string) {
  const identifier = normalizeIdentifier(identifierInput);
  if (!(await connectRedis())) {
    throw new AppError(503, "OTP_STORE_UNAVAILABLE", "OTP service is temporarily unavailable");
  }
  const key = otpKey(identifier);
  const outcome = Number(
    await redis.eval(OTP_VERIFY_SCRIPT, {
      keys: [key],
      arguments: [hashOtp(identifier, otp), String(env.OTP_VERIFY_MAX_ATTEMPTS)]
    })
  );
  if (outcome === -2) {
    throw new AppError(429, "OTP_ATTEMPTS_EXCEEDED", "OTP verification attempts exceeded");
  }
  if (outcome !== 1) {
    throw new AppError(401, "OTP_INVALID_OR_EXPIRED", "OTP is invalid or expired");
  }

  const user = await findUserByIdentifier(identifier);
  if (!user) throw new AppError(401, "OTP_INVALID_OR_EXPIRED", "OTP is invalid or expired");
  if (user.status !== "active") {
    throw new AppError(403, "ACCOUNT_INACTIVE", "Account is not active");
  }
  return {
    user: toPublicUser(user),
    token: issueToken({ userId: user.user_id, role: user.role_name })
  };
}
