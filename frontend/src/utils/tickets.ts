import type { CompetitionTicketItem, Ticket } from "../types/api";

export function normalizeTicket(item: CompetitionTicketItem): Ticket {
  return {
    ticket_id: String(item.ticket_id ?? ""),
    match_id: String(item.match_id ?? ""),
    sport_type_id: Number(item.sport_type_id ?? 0),
    sport_type: item.sport_type ?? "",
    home_team_id: String(item.home_team_id ?? ""),
    home_team: item.home_team ?? "",
    away_team_id: String(item.away_team_id ?? ""),
    away_team: item.away_team ?? "",
    venue_id: Number(item.venue_id ?? 0),
    venue_name: item.venue_name ?? "",
    city_id: Number(item.city_id ?? 0),
    city_name: item.city_name ?? "",
    match_datetime: item.match_datetime ?? new Date().toISOString(),
    match_status: item.match_status ?? "scheduled",
    category_id: Number(item.category_id ?? 0),
    category_name: item.category_name ?? "",
    price: String(item.price ?? 0),
    status: item.status ?? "available",
    remaining_capacity: Number(item.remaining_capacity ?? 1),
    section_name: item.section_name ?? "",
    row_number: String(item.row_number ?? ""),
    seat_number: String(item.seat_number ?? ""),
    competition_name: item.competition_name ?? null,
    facilities: item.facilities ?? [],
  };
}
