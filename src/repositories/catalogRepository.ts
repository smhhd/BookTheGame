import { query } from "../config/database";

export async function listCities() {
  const result = await query(
    `SELECT c.city_id, c.name, p.province_id, p.name AS province_name
     FROM cities c
     JOIN provinces p ON p.province_id = c.province_id
     ORDER BY p.name, c.name`
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
    [cityId ?? null]
  );
  return result.rows;
}
