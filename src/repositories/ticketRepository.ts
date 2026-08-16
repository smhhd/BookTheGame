import { query } from "../config/database";
import { TicketSearchInput } from "../validators/ticketValidators";

const sortColumns: Record<TicketSearchInput["sortBy"], string> = {
  matchDate: "m.match_datetime",
  price: "t.price",
  createdAt: "t.created_at",
  ticketId: "t.ticket_id",
  relevance: "m.match_datetime"
};

function filters(input: TicketSearchInput) {
  const clauses: string[] = [];
  const values: unknown[] = [];
  const add = (condition: string, value: unknown) => {
    values.push(value);
    clauses.push(condition.replace("?", `$${values.length}`));
  };
  if (input.q) {
    add(
      "concat_ws(' ', st.name, ht.name, at.name, v.name, c.name, tc.name, comp.name) ILIKE '%' || ? || '%'",
      input.q
    );
  }
  if (input.team) add("concat_ws(' ', ht.name, at.name) ILIKE '%' || ? || '%'", input.team);
  if (input.sport) add("st.name ILIKE '%' || ? || '%'", input.sport);
  if (input.sportTypeId) add("m.sport_type_id = ?", input.sportTypeId);
  if (input.homeTeamId) add("m.home_team_id = ?", input.homeTeamId);
  if (input.awayTeamId) add("m.away_team_id = ?", input.awayTeamId);
  if (input.cityId) add("v.city_id = ?", input.cityId);
  if (input.venueId) add("v.venue_id = ?", input.venueId);
  if (input.categoryId) add("t.category_id = ?", input.categoryId);
  if (input.status) add("t.status = ?", input.status);
  if (input.facility) {
    add(
      "EXISTS (SELECT 1 FROM ticket_facilities tf2 JOIN facilities f2 ON f2.facility_id = tf2.facility_id WHERE tf2.ticket_id = t.ticket_id AND f2.name = ?)",
      input.facility
    );
  }
  if (input.startDate) add("m.match_datetime >= ?::timestamptz", input.startDate);
  if (input.endDate) add("m.match_datetime <= ?::timestamptz", input.endDate);
  if (input.minPrice !== undefined) add("t.price >= ?::numeric", input.minPrice);
  if (input.maxPrice !== undefined) add("t.price <= ?::numeric", input.maxPrice);
  if (input.remainingOnly) {
    clauses.push("t.status = 'available'");
    clauses.push("m.status = 'scheduled'");
    clauses.push("m.match_datetime > CURRENT_TIMESTAMP");
  }
  return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", values };
}

const joins = `
  FROM tickets t
  JOIN matches m ON m.match_id = t.match_id
  JOIN sport_types st ON st.sport_type_id = m.sport_type_id
  LEFT JOIN competitions comp ON comp.competition_id = m.competition_id
  JOIN teams ht ON ht.team_id = m.home_team_id
  JOIN teams at ON at.team_id = m.away_team_id
  JOIN venues v ON v.venue_id = t.venue_id
  JOIN cities c ON c.city_id = v.city_id
  JOIN ticket_categories tc ON tc.category_id = t.category_id
  JOIN seats s ON s.seat_id = t.seat_id
`;

export async function searchTickets(input: TicketSearchInput) {
  const { where, values } = filters(input);
  const count = await query<{ total: string }>(
    `SELECT count(*)::text AS total ${joins} ${where}`,
    values
  );
  const offset = (input.page - 1) * input.limit;
  const pageValues = [...values, input.limit, offset];
  const sortColumn = sortColumns[input.sortBy];
  const sortOrder = input.sortOrder === "desc" ? "DESC" : "ASC";
  const result = await query(
    `SELECT
       t.ticket_id, t.price, t.status, t.category_id, tc.name AS category_name,
       m.match_id, m.match_datetime, m.status AS match_status,
       st.sport_type_id, st.name AS sport_type,
       comp.competition_id, comp.name AS competition_name,
       ht.team_id AS home_team_id, ht.name AS home_team,
       at.team_id AS away_team_id, at.name AS away_team,
       v.venue_id, v.name AS venue_name, c.city_id, c.name AS city_name,
       s.seat_id, s.section_name, s.row_number, s.seat_number,
       COALESCE((
         SELECT jsonb_agg(jsonb_build_object('facilityId', f.facility_id::text, 'name', f.name) ORDER BY f.name)
         FROM ticket_facilities tf JOIN facilities f ON f.facility_id = tf.facility_id
         WHERE tf.ticket_id = t.ticket_id
       ), '[]'::jsonb) AS facilities,
       CASE WHEN t.status = 'available' THEN 1 ELSE 0 END AS remaining_capacity
     ${joins} ${where}
     ORDER BY ${sortColumn} ${sortOrder}, t.ticket_id ASC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    pageValues
  );
  const total = Number(count.rows[0]?.total ?? 0);
  return {
    items: result.rows,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit)
    }
  };
}

export async function getTicketDetails(ticketId: number) {
  const result = await query(
    `SELECT
       t.ticket_id, t.price, t.status, t.created_at,
       tc.category_id, tc.name AS category_name, tc.description AS category_description,
       m.match_id, m.match_datetime, m.status AS match_status,
       st.sport_type_id, st.name AS sport_type,
       comp.competition_id, comp.name AS competition_name,
       ht.team_id AS home_team_id, ht.name AS home_team,
       at.team_id AS away_team_id, at.name AS away_team,
       v.venue_id, v.name AS venue_name, v.address, v.venue_type,
       c.city_id, c.name AS city_name, p.name AS province_name,
       s.seat_id, s.section_name, s.row_number, s.seat_number,
       CASE WHEN t.status = 'available' THEN 1 ELSE 0 END AS remaining_capacity,
       COALESCE(
         jsonb_agg(DISTINCT jsonb_build_object('facilityId', f.facility_id, 'name', f.name))
           FILTER (WHERE f.facility_id IS NOT NULL),
         '[]'::jsonb
       ) AS facilities
     FROM tickets t
     JOIN matches m ON m.match_id = t.match_id
     JOIN sport_types st ON st.sport_type_id = m.sport_type_id
     LEFT JOIN competitions comp ON comp.competition_id = m.competition_id
     JOIN teams ht ON ht.team_id = m.home_team_id
     JOIN teams at ON at.team_id = m.away_team_id
     JOIN venues v ON v.venue_id = t.venue_id
     JOIN cities c ON c.city_id = v.city_id
     JOIN provinces p ON p.province_id = c.province_id
     JOIN ticket_categories tc ON tc.category_id = t.category_id
     JOIN seats s ON s.seat_id = t.seat_id
     LEFT JOIN ticket_facilities tf ON tf.ticket_id = t.ticket_id
     LEFT JOIN facilities f ON f.facility_id = tf.facility_id
     WHERE t.ticket_id = $1
     GROUP BY
       t.ticket_id, tc.category_id, m.match_id, st.sport_type_id,
       comp.competition_id, ht.team_id, at.team_id, v.venue_id,
       c.city_id, p.name, s.seat_id`,
    [ticketId]
  );
  return result.rows[0] ?? null;
}
