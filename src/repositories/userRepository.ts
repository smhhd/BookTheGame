import { PoolClient } from "pg";
import { query } from "../config/database";

export interface UserRow {
  user_id: string;
  role_name: "spectator" | "support";
  city_id: number | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  profile_image_url: string | null;
  birth_date: string | null;
  wallet_balance: string;
  status: "active" | "inactive" | "blocked";
  registered_at: Date;
  city_name?: string | null;
}

const publicColumns = `
  u.user_id, r.role_name, u.city_id, u.first_name, u.last_name,
  u.email, u.phone, u.password_hash, u.profile_image_url, u.birth_date,
  u.wallet_balance, u.status, u.registered_at
`;

export async function findUserById(userId: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `SELECT ${publicColumns}
     FROM users u JOIN roles r ON r.role_id = u.role_id
     WHERE u.user_id = $1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function findUserByIdentifier(identifier: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `SELECT ${publicColumns}
     FROM users u JOIN roles r ON r.role_id = u.role_id
     WHERE lower(u.email) = lower($1) OR u.phone = $1
     LIMIT 1`,
    [identifier]
  );
  return result.rows[0] ?? null;
}

export async function contactExists(
  email: string | null,
  phone: string | null,
  excludingUserId?: string
): Promise<{ email: boolean; phone: boolean }> {
  const result = await query<{ email_exists: boolean; phone_exists: boolean }>(
    `SELECT
       EXISTS(
         SELECT 1 FROM users
         WHERE $1::text IS NOT NULL AND lower(email) = lower($1)
           AND ($3::bigint IS NULL OR user_id <> $3)
       ) AS email_exists,
       EXISTS(
         SELECT 1 FROM users
         WHERE $2::text IS NOT NULL AND phone = $2
           AND ($3::bigint IS NULL OR user_id <> $3)
       ) AS phone_exists`,
    [email, phone, excludingUserId ?? null]
  );
  return {
    email: result.rows[0]?.email_exists ?? false,
    phone: result.rows[0]?.phone_exists ?? false
  };
}

export async function createUser(input: {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  cityId: number | null;
}): Promise<UserRow> {
  const result = await query<UserRow>(
    `WITH inserted AS (
       INSERT INTO users (
         role_id, city_id, first_name, last_name, email, phone, password_hash
       )
       VALUES (1, $1, $2, $3, lower($4), $5, $6)
       RETURNING *
     )
     SELECT ${publicColumns}
     FROM inserted u JOIN roles r ON r.role_id = u.role_id`,
    [
      input.cityId,
      input.firstName,
      input.lastName,
      input.email,
      input.phone,
      input.passwordHash
    ]
  );
  return result.rows[0]!;
}

export async function updateUser(
  client: PoolClient,
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
): Promise<UserRow> {
  const values: unknown[] = [userId];
  const assignments: string[] = [];
  const fields: Array<[keyof typeof input, string]> = [
    ["firstName", "first_name"],
    ["lastName", "last_name"],
    ["email", "email"],
    ["phone", "phone"],
    ["cityId", "city_id"],
    ["profileImageUrl", "profile_image_url"],
    ["birthDate", "birth_date"]
  ];
  for (const [property, column] of fields) {
    if (Object.prototype.hasOwnProperty.call(input, property)) {
      values.push(input[property]);
      assignments.push(`${column} = $${values.length}`);
    }
  }
  const result = await client.query<UserRow>(
    `WITH updated AS (
       UPDATE users
       SET ${assignments.join(", ")}
       WHERE user_id = $1
       RETURNING *
     )
     SELECT ${publicColumns}
     FROM updated u JOIN roles r ON r.role_id = u.role_id`,
    values
  );
  return result.rows[0]!;
}

export function toPublicUser(user: UserRow): Omit<UserRow, "password_hash"> {
  const { password_hash: _passwordHash, ...safe } = user;
  return safe;
}
