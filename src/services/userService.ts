import { transaction } from "../config/database";
import { cacheDelete, cacheGet, cacheSet } from "../config/redis";
import { env } from "../config/env";
import {
  contactExists,
  findUserById,
  toPublicUser,
  updateUser
} from "../repositories/userRepository";
import { AppError } from "../utils/AppError";

export async function getProfile(userId: string) {
  const key = `profile:${userId}`;
  const cached = await cacheGet<ReturnType<typeof toPublicUser>>(key);
  if (cached) return cached;
  const user = await findUserById(userId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User was not found");
  const profile = toPublicUser(user);
  await cacheSet(key, profile, env.CACHE_PROFILE_TTL_SECONDS);
  return profile;
}

export async function updateProfile(
  userId: string,
  input: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    cityId?: number | null;
    profileImageUrl?: string | null;
    birthDate?: string | null;
  }
) {
  const current = await findUserById(userId);
  if (!current) throw new AppError(404, "USER_NOT_FOUND", "User was not found");
  const nextEmail = Object.prototype.hasOwnProperty.call(input, "email")
    ? input.email ?? null
    : current.email;
  const nextPhone = Object.prototype.hasOwnProperty.call(input, "phone")
    ? input.phone ?? null
    : current.phone;
  if (!nextEmail && !nextPhone) {
    throw new AppError(422, "CONTACT_REQUIRED", "At least one of email or phone is required");
  }
  const duplicate = await contactExists(nextEmail, nextPhone, userId);
  if (duplicate.email) throw new AppError(409, "EMAIL_EXISTS", "Email is already registered");
  if (duplicate.phone) throw new AppError(409, "PHONE_EXISTS", "Phone is already registered");

  const user = await transaction((client) => updateUser(client, userId, input));
  await cacheDelete(`profile:${userId}`);
  return toPublicUser(user);
}
