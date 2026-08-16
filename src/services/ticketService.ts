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
import { searchTicketsInElasticsearch } from "../search/ticketSearch";

function withCacheMetadata<T extends object>(data: T, cacheHit: boolean): T & { cacheHit?: boolean } {
  return {
    ...data,
    ...(env.NODE_ENV !== "production" ? { cacheHit } : {})
  };
}

type TicketSearchResult = {
  items: unknown[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  search: { source: "elasticsearch" | "postgresql-fallback"; tookMs: number };
};

export async function search(input: TicketSearchInput) {
  const version = await getTicketCacheVersion();
  const key = stableCacheKey(`tickets:search:v${version}`, input);
  const cached = await cacheGet<TicketSearchResult>(key);
  if (cached) return withCacheMetadata(cached, true);
  let result: TicketSearchResult;
  try {
    result = await searchTicketsInElasticsearch(input);
  } catch (error) {
    if (!env.SEARCH_FALLBACK_TO_POSTGRES) {
      throw new AppError(503, "SEARCH_UNAVAILABLE", "Ticket search is temporarily unavailable");
    }
    const startedAt = Date.now();
    console.warn("Elasticsearch search failed; using PostgreSQL fallback", {
      error: error instanceof Error ? error.message : String(error)
    });
    const fallback = await ticketRepository.searchTickets(input);
    result = {
      ...fallback,
      search: { source: "postgresql-fallback" as const, tookMs: Date.now() - startedAt }
    };
  }
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
