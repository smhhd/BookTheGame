import { z } from "zod";
import { id, pagination } from "./common";

export const createReportSchema = z
  .object({
    categoryId: id,
    description: z.string().trim().min(5).max(5000),
    ticketId: id.optional(),
    reservationId: id.optional(),
    paymentId: id.optional()
  })
  .strict()
  .refine(
    (value) =>
      [value.ticketId, value.reservationId, value.paymentId].filter(
        (item) => item !== undefined
      ).length === 1,
    "Exactly one of ticketId, reservationId, or paymentId is required"
  );

export const reportListSchema = z
  .object({
    status: z.enum(["pending", "reviewed", "rejected"]).optional(),
    ...pagination
  })
  .strict();

export const reportIdParamsSchema = z.object({ id }).strict();
export const reportStatusSchema = z
  .object({
    status: z.enum(["pending", "reviewed", "rejected"]),
    response: z.string().trim().min(2).max(5000).optional()
  })
  .strict()
  .refine((value) => value.status !== "pending" || value.response === undefined, {
    message: "A pending report cannot have a support response"
  });
