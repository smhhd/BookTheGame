import { query } from "../config/database";
import { TicketSearchDocument } from "./types";

interface SearchDocumentRow {
  ticket_id: string; match_id: string; sport_type_id: string; sport_type: string;
  competition_id: string | null; competition_name: string | null;
  home_team_id: string; home_team: string; away_team_id: string; away_team: string;
  city_id: string; city_name: string; venue_id: string; venue_name: string; venue_type: string;
  category_id: string; category_name: string; seat_id: string; section_name: string;
  row_number: string; seat_number: string; facilities: Array<{ facilityId: string; name: string }>;
  price: string; status: TicketSearchDocument["status"]; match_status: TicketSearchDocument["matchStatus"];
  match_datetime: Date; created_at: Date;
}

const documentSelect = `
  SELECT t.ticket_id, t.match_id, m.sport_type_id, st.name AS sport_type,
         comp.competition_id, comp.name AS competition_name,
         m.home_team_id, ht.name AS home_team, m.away_team_id, at.name AS away_team,
         c.city_id, c.name AS city_name, t.venue_id, v.name AS venue_name, v.venue_type,
         t.category_id, tc.name AS category_name, t.seat_id,
         s.section_name, s.row_number, s.seat_number,
         COALESCE((
           SELECT jsonb_agg(jsonb_build_object('facilityId', f.facility_id::text, 'name', f.name) ORDER BY f.name)
           FROM ticket_facilities tf JOIN facilities f ON f.facility_id = tf.facility_id
           WHERE tf.ticket_id = t.ticket_id
         ), '[]'::jsonb) AS facilities,
         t.price, t.status, m.status AS match_status, m.match_datetime, t.created_at
  FROM tickets t
  JOIN matches m ON m.match_id = t.match_id
  JOIN sport_types st ON st.sport_type_id = m.sport_type_id
  LEFT JOIN competitions comp ON comp.competition_id = m.competition_id
  JOIN teams ht ON ht.team_id = m.home_team_id
  JOIN teams at ON at.team_id = m.away_team_id
  JOIN venues v ON v.venue_id = t.venue_id
  JOIN cities c ON c.city_id = v.city_id
  JOIN ticket_categories tc ON tc.category_id = t.category_id
  JOIN seats s ON s.seat_id = t.seat_id`;

function toDocument(row: SearchDocumentRow): TicketSearchDocument {
  return {
    ticketId: row.ticket_id,
    ticketOrder: Number(row.ticket_id),
    matchId: row.match_id,
    sportTypeId: row.sport_type_id,
    sportType: row.sport_type,
    competitionId: row.competition_id,
    competitionName: row.competition_name,
    homeTeamId: row.home_team_id,
    homeTeam: row.home_team,
    awayTeamId: row.away_team_id,
    awayTeam: row.away_team,
    cityId: row.city_id,
    cityName: row.city_name,
    venueId: row.venue_id,
    venueName: row.venue_name,
    venueType: row.venue_type,
    categoryId: row.category_id,
    categoryName: row.category_name,
    seatId: row.seat_id,
    sectionName: row.section_name,
    rowNumber: row.row_number,
    seatNumber: row.seat_number,
    facilities: row.facilities,
    facilityNames: row.facilities.map((facility) => facility.name),
    price: Number(row.price),
    status: row.status,
    matchStatus: row.match_status,
    remainingCapacity: row.status === "available" ? 1 : 0,
    matchDatetime: row.match_datetime.toISOString(),
    createdAt: row.created_at.toISOString()
  };
}

export async function listSearchDocuments(afterTicketId: string, limit: number) {
  const result = await query<SearchDocumentRow>(
    `${documentSelect} WHERE t.ticket_id > $1 ORDER BY t.ticket_id LIMIT $2`,
    [afterTicketId, limit]
  );
  return result.rows.map(toDocument);
}

export async function getSearchDocuments(ticketIds: readonly (string | number)[]) {
  if (ticketIds.length === 0) return [];
  const result = await query<SearchDocumentRow>(
    `${documentSelect} WHERE t.ticket_id = ANY($1::bigint[]) ORDER BY t.ticket_id`,
    [ticketIds.map(String)]
  );
  return result.rows.map(toDocument);
}
