import { z } from "zod";
import { id, pagination } from "./common";

export const adminReservationListSchema = z
  .object({
    status: z.enum(["pending", "paid", "cancelled", "expired"]).optional(),
    ...pagination
  })
  .strict();
export const adminReservationParamsSchema = z.object({ id }).strict();
export const adminReservationStatusSchema = z
  .object({ status: z.enum(["paid", "cancelled", "expired"]) })
  .strict();
export const adminReservationTicketSchema = z.object({ ticketId: id }).strict();
