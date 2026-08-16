import { query } from "../config/database";

export async function listCities() {
  const result = await query(
    `SELECT c.city_id, c.name, p.province_id, p.name AS province_name
     FROM cities c
     JOIN provinces p ON p.province_id = c.province_id
     ORDER BY p.name, c.name`,
  );
  return result.rows;
}

export async function listVenues(cityId?: number) {
  const result = await query(
    `SELECT v.venue_id, v.city_id, v.name, v.address, v.venue_type,
            c.name AS city_name, p.name AS province_name
     FROM venues v
     JOIN cities c ON c.city_id = v.city_id
     JOIN provinces p ON p.province_id = c.province_id
     WHERE ($1::int IS NULL OR v.city_id = $1)
     ORDER BY c.name, v.name`,
    [cityId ?? null],
  );
  return result.rows;
}

// Match-based catalog methods
export async function listMatches() {
  const result = await query(
    `SELECT
       m.match_id,
       m.competition_id,
       comp.name AS competition_name,
       st.name AS sport_type,
       ht.name AS home_team,
       at.name AS away_team,
       v.name AS venue_name,
       c.name AS city_name,
       m.match_datetime,
       m.status AS match_status,
       COUNT(CASE WHEN t.status = 'available' THEN 1 END)::int AS available_count,
       COUNT(t.ticket_id)::int AS ticket_count,
       MIN(t.price) AS min_price,
       MAX(t.price) AS max_price
     FROM matches m
     JOIN sport_types st ON st.sport_type_id = m.sport_type_id
     LEFT JOIN competitions comp ON comp.competition_id = m.competition_id
     JOIN teams ht ON ht.team_id = m.home_team_id
     JOIN teams at ON at.team_id = m.away_team_id
     JOIN venues v ON v.venue_id = m.venue_id
     JOIN cities c ON c.city_id = v.city_id
     LEFT JOIN tickets t ON t.match_id = m.match_id
     GROUP BY
       m.match_id, m.competition_id, comp.name, st.name,
       ht.name, at.name, v.name, c.name, m.match_datetime, m.status
     ORDER BY available_count DESC, m.match_datetime ASC, m.match_id ASC`,
  );
  return result.rows;
}

export async function listMatchTickets(matchId: number) {
  const result = await query(
    `SELECT 
       t.ticket_id, t.price, t.status, t.category_id, tc.name AS category_name,
       m.match_id, m.match_datetime, m.status AS match_status,
       st.sport_type_id, st.name AS sport_type,
       comp.competition_id, comp.name AS competition_name,
       ht.team_id AS home_team_id, ht.name AS home_team,
       at.team_id AS away_team_id, at.name AS away_team,
       v.venue_id, v.name AS venue_name, ci.city_id, ci.name AS city_name,
       s.seat_id, s.section_name, s.row_number, s.seat_number,
       COALESCE((
         SELECT jsonb_agg(jsonb_build_object('facilityId', f.facility_id::text, 'name', f.name) ORDER BY f.name)
         FROM ticket_facilities tf JOIN facilities f ON f.facility_id = tf.facility_id
         WHERE tf.ticket_id = t.ticket_id
       ), '[]'::jsonb) AS facilities,
       CASE WHEN t.status = 'available' THEN 1 ELSE 0 END AS remaining_capacity
     FROM tickets t
     JOIN matches m ON m.match_id = t.match_id
     JOIN sport_types st ON st.sport_type_id = m.sport_type_id
     LEFT JOIN competitions comp ON comp.competition_id = m.competition_id
     JOIN teams ht ON ht.team_id = m.home_team_id
     JOIN teams at ON at.team_id = m.away_team_id
     JOIN venues v ON v.venue_id = t.venue_id
     JOIN cities ci ON ci.city_id = v.city_id
     JOIN ticket_categories tc ON tc.category_id = t.category_id
     JOIN seats s ON s.seat_id = t.seat_id
     WHERE m.match_id = $1
     ORDER BY (CASE WHEN t.status = 'available' THEN 0 ELSE 1 END), m.match_datetime ASC, t.ticket_id ASC`,
    [matchId],
  );
  return result.rows;
}

export async function listCompetitions() {
  const result = await query(
    `SELECT c.competition_id, c.name, c.sport_type_id, st.name AS sport_type
     FROM competitions c
     JOIN sport_types st ON st.sport_type_id = c.sport_type_id
     ORDER BY st.name, c.name`,
  );
  return result.rows;
}

export async function listCompetitionTickets(competitionId: number) {
  const result = await query(
    `SELECT 
       t.ticket_id, t.price, t.status, t.category_id, tc.name AS category_name,
       m.match_id, m.match_datetime, m.status AS match_status,
       st.sport_type_id, st.name AS sport_type,
       c.competition_id, c.name AS competition_name,
       ht.team_id AS home_team_id, ht.name AS home_team,
       at.team_id AS away_team_id, at.name AS away_team,
       v.venue_id, v.name AS venue_name, ci.city_id, ci.name AS city_name,
       s.seat_id, s.section_name, s.row_number, s.seat_number,
       COALESCE((
         SELECT jsonb_agg(jsonb_build_object('facilityId', f.facility_id::text, 'name', f.name) ORDER BY f.name)
         FROM ticket_facilities tf JOIN facilities f ON f.facility_id = tf.facility_id
         WHERE tf.ticket_id = t.ticket_id
       ), '[]'::jsonb) AS facilities,
       CASE WHEN t.status = 'available' THEN 1 ELSE 0 END AS remaining_capacity
     FROM tickets t
     JOIN matches m ON m.match_id = t.match_id
     JOIN sport_types st ON st.sport_type_id = m.sport_type_id
     JOIN competitions c ON c.competition_id = m.competition_id
     JOIN teams ht ON ht.team_id = m.home_team_id
     JOIN teams at ON at.team_id = m.away_team_id
     JOIN venues v ON v.venue_id = t.venue_id
     JOIN cities ci ON ci.city_id = v.city_id
     JOIN ticket_categories tc ON tc.category_id = t.category_id
     JOIN seats s ON s.seat_id = t.seat_id
     WHERE c.competition_id = $1
     ORDER BY (CASE WHEN t.status = 'available' THEN 0 ELSE 1 END), m.match_datetime ASC, t.ticket_id ASC`,
    [competitionId],
  );
  return result.rows;
}
