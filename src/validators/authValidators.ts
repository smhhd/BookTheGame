import { z } from "zod";
import { email, id, phone } from "./common";

const password = z
  .string()
  .min(8)
  .max(72)
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: email.nullish(),
    phone: phone.nullish(),
    password,
    cityId: id.nullish()
  })
  .strict()
  .refine((value) => Boolean(value.email || value.phone), {
    message: "At least one of email or phone is required"
  });

export const otpRequestSchema = z
  .object({ identifier: z.union([email, phone]) })
  .strict();

export const otpVerifySchema = z
  .object({
    identifier: z.union([email, phone]),
    otp: z.string().regex(/^[0-9]{6}$/)
  })
  .strict();
