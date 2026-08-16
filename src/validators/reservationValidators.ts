import { z } from "zod";
import { id, pagination } from "./common";

export const createReservationSchema = z
  .object({
    ticketIds: z.array(id).min(1).max(10)
  })
  .strict()
  .refine((value) => new Set(value.ticketIds).size === value.ticketIds.length, {
    message: "ticketIds must be unique"
  });

export const reservationIdParamsSchema = z.object({ reservationId: id }).strict();

export const reservationHistorySchema = z
  .object({
    status: z.enum(["pending", "paid", "cancelled", "expired"]).optional(),
    ...pagination
  })
  .strict();

export const cancellationSchema = z
  .object({
    reason: z.string().trim().min(3).max(1000).optional()
  })
  .strict();
