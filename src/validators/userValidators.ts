import { z } from "zod";
import { email, id, phone } from "./common";

export const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    email: email.nullable().optional(),
    phone: phone.nullable().optional(),
    cityId: id.nullable().optional(),
    profileImageUrl: z.string().trim().url().max(2048).nullable().optional(),
    birthDate: z.iso
      .date()
      .refine((value) => value <= new Date().toISOString().slice(0, 10), {
        message: "Birth date cannot be in the future"
      })
      .nullable()
      .optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");
