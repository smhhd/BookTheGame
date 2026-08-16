import { z } from "zod";

export const id = z.coerce.number().int().positive();
export const idParams = (name: string) => z.object({ [name]: id }).strict();

export const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{10,15}$/, "Phone must contain 10 to 15 digits");

export const email = z.string().trim().email().max(255).transform((value) => value.toLowerCase());

export const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
};
