import { env } from "../config/env";
import {
  cacheGet,
  cacheSet,
  getTicketCacheVersion
} from "../config/redis";
import * as ticketRepository from "../repositories/ticketRepository";
import { AppError } from "../utils/AppError";
import { stableCacheKey } from "../utils/cacheKey";
import { TicketSearchInput } from "../validators/ticketValidators";

function withCacheMetadata<T extends object>(data: T, cacheHit: boolean): T & { cacheHit?: boolean } {
  return {
    ...data,
    ...(env.NODE_ENV !== "production" ? { cacheHit } : {})
  };
}

export async function search(input: TicketSearchInput) {
  const version = await getTicketCacheVersion();
  const key = stableCacheKey(`tickets:search:v${version}`, input);
  const cached = await cacheGet<object>(key);
  if (cached) return withCacheMetadata(cached, true);
  const result = await ticketRepository.searchTickets(input);
  await cacheSet(key, result, env.CACHE_SEARCH_TTL_SECONDS);
  return withCacheMetadata(result, false);
}

export async function details(ticketId: number) {
  const version = await getTicketCacheVersion();
  const key = `tickets:detail:v${version}:${ticketId}`;
  const cached = await cacheGet<object>(key);
  if (cached) return withCacheMetadata(cached, true);
  const result = await ticketRepository.getTicketDetails(ticketId);
  if (!result) throw new AppError(404, "TICKET_NOT_FOUND", "Ticket was not found");
  const row = result as Record<string, unknown>;
  const sport = String(row.sport_type ?? "").toLowerCase();
  const supportsSportDetails = ["football", "volleyball", "basketball"].includes(sport);
  const enriched = {
    ...row,
    sportSpecificDetails: supportsSportDetails
      ? {
          sportType: row.sport_type,
          venueType: row.venue_type,
          seat: {
            sectionName: row.section_name,
            rowNumber: row.row_number,
            seatNumber: row.seat_number
          },
          facilities: row.facilities
        }
      : null
  };
  await cacheSet(key, enriched, env.CACHE_TICKET_TTL_SECONDS);
  return withCacheMetadata(enriched, false);
}
