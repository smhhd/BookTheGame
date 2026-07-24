import { z } from "zod";
import { id, pagination } from "./common";

const dateTime = z.string().datetime({ offset: true });

export const venueQuerySchema = z
  .object({
    cityId: id.optional()
  })
  .strict();

export const ticketSearchSchema = z
  .object({
    sportTypeId: id.optional(),
    homeTeamId: id.optional(),
    awayTeamId: id.optional(),
    cityId: id.optional(),
    venueId: id.optional(),
    categoryId: id.optional(),
    startDate: dateTime.optional(),
    endDate: dateTime.optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    remainingOnly: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
    sortBy: z
      .enum(["matchDate", "price", "createdAt", "ticketId"])
      .default("matchDate"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
    ...pagination
  })
  .strict()
  .refine(
    (value) =>
      value.minPrice === undefined ||
      value.maxPrice === undefined ||
      value.minPrice <= value.maxPrice,
    { message: "minPrice must not exceed maxPrice" }
  )
  .refine(
    (value) =>
      value.startDate === undefined ||
      value.endDate === undefined ||
      new Date(value.startDate) <= new Date(value.endDate),
    { message: "startDate must not exceed endDate" }
  );

export const ticketIdParamsSchema = z.object({ ticketId: id }).strict();
export type TicketSearchInput = z.infer<typeof ticketSearchSchema>;
