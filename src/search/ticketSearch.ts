import { env } from "../config/env";
import { TicketSearchInput } from "../validators/ticketValidators";
import { elasticRequest } from "./client";
import { TicketSearchDocument } from "./types";

interface SearchResponse {
  took: number;
  hits: {
    total: number | { value: number };
    hits: Array<{ _source: TicketSearchDocument }>;
  };
}

export function buildTicketSearchBody(input: TicketSearchInput): Record<string, unknown> {
  const filter: Array<Record<string, unknown>> = [];
  const must: Array<Record<string, unknown>> = [];
  const term = (field: string, value: unknown) => filter.push({ term: { [field]: String(value) } });
  if (input.sportTypeId) term("sportTypeId", input.sportTypeId);
  if (input.homeTeamId) term("homeTeamId", input.homeTeamId);
  if (input.awayTeamId) term("awayTeamId", input.awayTeamId);
  if (input.cityId) term("cityId", input.cityId);
  if (input.venueId) term("venueId", input.venueId);
  if (input.categoryId) term("categoryId", input.categoryId);
  if (input.status) term("status", input.status);
  if (input.facility) term("facilityNames", input.facility);
  if (input.remainingOnly) {
    term("status", "available");
    term("matchStatus", "scheduled");
  }
  const matchDateRange: Record<string, string> = {};
  if (input.startDate) matchDateRange.gte = input.startDate;
  else if (input.remainingOnly) matchDateRange.gt = "now";
  if (input.endDate) matchDateRange.lte = input.endDate;
  if (Object.keys(matchDateRange).length) filter.push({ range: { matchDatetime: matchDateRange } });
  const priceRange: Record<string, number> = {};
  if (input.minPrice !== undefined) priceRange.gte = input.minPrice;
  if (input.maxPrice !== undefined) priceRange.lte = input.maxPrice;
  if (Object.keys(priceRange).length) filter.push({ range: { price: priceRange } });
  if (input.q) {
    must.push({
      multi_match: {
        query: input.q,
        fields: ["homeTeam^4", "awayTeam^4", "sportType^2", "competitionName^2", "venueName", "cityName", "categoryName"],
        type: "best_fields",
        fuzziness: "AUTO"
      }
    });
  }
  if (input.team) {
    must.push({ multi_match: { query: input.team, fields: ["homeTeam^2", "awayTeam^2"], operator: "and" } });
  }
  if (input.sport) must.push({ match: { sportType: { query: input.sport, operator: "and" } } });
  const sortField = {
    matchDate: "matchDatetime",
    price: "price",
    createdAt: "createdAt",
    ticketId: "ticketOrder"
  }[input.sortBy as Exclude<TicketSearchInput["sortBy"], "relevance">];
  const sort = input.sortBy === "relevance"
    ? [{ _score: "desc" }, { matchDatetime: "asc" }]
    : [{ [sortField!]: input.sortOrder }, { ticketId: "asc" }];
  return {
    from: (input.page - 1) * input.limit,
    size: input.limit,
    track_total_hits: true,
    query: { bool: { must: must.length ? must : [{ match_all: {} }], filter } },
    sort
  };
}

function toApiTicket(document: TicketSearchDocument) {
  return {
    ticket_id: document.ticketId,
    price: String(document.price),
    status: document.status,
    category_id: Number(document.categoryId),
    category_name: document.categoryName,
    match_id: document.matchId,
    match_datetime: document.matchDatetime,
    match_status: document.matchStatus,
    competition_id: document.competitionId,
    competition_name: document.competitionName,
    sport_type_id: Number(document.sportTypeId),
    sport_type: document.sportType,
    home_team_id: document.homeTeamId,
    home_team: document.homeTeam,
    away_team_id: document.awayTeamId,
    away_team: document.awayTeam,
    venue_id: Number(document.venueId),
    venue_name: document.venueName,
    city_id: Number(document.cityId),
    city_name: document.cityName,
    seat_id: document.seatId,
    section_name: document.sectionName,
    row_number: document.rowNumber,
    seat_number: document.seatNumber,
    facilities: document.facilities,
    remaining_capacity: document.remainingCapacity
  };
}

export async function searchTicketsInElasticsearch(input: TicketSearchInput) {
  const response = await elasticRequest<SearchResponse>(`${env.ELASTICSEARCH_INDEX}/_search`, {
    method: "POST",
    body: JSON.stringify(buildTicketSearchBody(input))
  });
  const total = typeof response.hits.total === "number" ? response.hits.total : response.hits.total.value;
  return {
    items: response.hits.hits.map((hit) => toApiTicket(hit._source)),
    pagination: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) },
    search: { source: "elasticsearch" as const, tookMs: response.took }
  };
}
