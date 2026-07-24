import { PoolClient } from "pg";
import { query } from "../config/database";

export interface LockedTicket {
  ticket_id: string;
  price: string;
  ticket_status: "available" | "reserved" | "sold" | "cancelled";
  match_id: string;
  match_status: "scheduled" | "postponed" | "cancelled" | "finished";
  match_datetime: Date;
}

export async function lockTickets(client: PoolClient, ticketIds: number[]) {
  const result = await client.query<LockedTicket>(
    `SELECT t.ticket_id, t.price, t.status AS ticket_status,
            m.match_id, m.status AS match_status, m.match_datetime
     FROM tickets t
     JOIN matches m ON m.match_id = t.match_id
     WHERE t.ticket_id = ANY($1::bigint[])
     ORDER BY t.ticket_id
     FOR UPDATE OF t`,
    [ticketIds]
  );
  return result.rows;
}

export async function createOrderWithReservations(
  client: PoolClient,
  userId: string,
  tickets: LockedTicket[],
  ttlMinutes: number
) {
  const order = await client.query<{ order_id: string; reserved_until: Date }>(
    `INSERT INTO orders (user_id, reserved_until)
     VALUES ($1, CURRENT_TIMESTAMP + make_interval(mins => $2))
     RETURNING order_id, reserved_until`,
    [userId, ttlMinutes]
  );
  const orderId = order.rows[0]!.order_id;
  const reservations = [];
  for (const ticket of tickets) {
    const inserted = await client.query(
      `INSERT INTO reservations (order_id, ticket_id, price_at_reservation)
       VALUES ($1, $2, $3)
       RETURNING reservation_id, ticket_id, status, price_at_reservation, created_at`,
      [orderId, ticket.ticket_id, ticket.price]
    );
    reservations.push(inserted.rows[0]);
  }
  const updated = await client.query(
    `UPDATE tickets
     SET status = 'reserved'
     WHERE ticket_id = ANY($1::bigint[]) AND status = 'available'
     RETURNING ticket_id`,
    [tickets.map((ticket) => ticket.ticket_id)]
  );
  return {
    orderId,
    reservedUntil: order.rows[0]!.reserved_until,
    reservations,
    updatedTicketCount: updated.rowCount ?? 0
  };
}

export async function listActiveReservations(userId: string) {
  const result = await query(
    `SELECT
       rs.reservation_id, rs.status, rs.price_at_reservation, rs.created_at,
       o.order_id, o.reserved_until,
       t.ticket_id, tc.name AS category_name,
       m.match_id, m.match_datetime,
       ht.name AS home_team, at.name AS away_team, v.name AS venue_name,
       s.section_name, s.row_number, s.seat_number
     FROM orders o
     JOIN reservations rs ON rs.order_id = o.order_id
     JOIN tickets t ON t.ticket_id = rs.ticket_id
     JOIN matches m ON m.match_id = t.match_id
     JOIN teams ht ON ht.team_id = m.home_team_id
     JOIN teams at ON at.team_id = m.away_team_id
     JOIN venues v ON v.venue_id = t.venue_id
     JOIN seats s ON s.seat_id = t.seat_id
     JOIN ticket_categories tc ON tc.category_id = t.category_id
     WHERE o.user_id = $1
       AND rs.status = 'pending'
       AND o.status = 'pending'
       AND o.reserved_until > CURRENT_TIMESTAMP
     ORDER BY o.reserved_until`,
    [userId]
  );
  return result.rows;
}

export async function listReservationHistory(
  userId: string,
  status: string | undefined,
  page: number,
  limit: number
) {
  const values: unknown[] = [userId];
  const statusClause = status ? `AND rs.status = $${values.push(status)}` : "";
  const count = await query<{ total: string }>(
    `SELECT count(*)::text AS total
     FROM orders o JOIN reservations rs ON rs.order_id = o.order_id
     WHERE o.user_id = $1 ${statusClause}`,
    values
  );
  values.push(limit, (page - 1) * limit);
  const result = await query(
    `SELECT
       rs.reservation_id, rs.status, rs.price_at_reservation,
       rs.created_at, rs.cancelled_at, o.order_id, o.status AS order_status,
       o.reserved_until, t.ticket_id, m.match_id, m.match_datetime,
       ht.name AS home_team, at.name AS away_team, v.name AS venue_name,
       p.payment_id, p.status AS payment_status, p.paid_at
     FROM orders o
     JOIN reservations rs ON rs.order_id = o.order_id
     JOIN tickets t ON t.ticket_id = rs.ticket_id
     JOIN matches m ON m.match_id = t.match_id
     JOIN teams ht ON ht.team_id = m.home_team_id
     JOIN teams at ON at.team_id = m.away_team_id
     JOIN venues v ON v.venue_id = t.venue_id
     LEFT JOIN LATERAL (
       SELECT payment_id, status, paid_at
       FROM payments
       WHERE order_id = o.order_id
       ORDER BY payment_id DESC LIMIT 1
     ) p ON true
     WHERE o.user_id = $1 ${statusClause}
     ORDER BY rs.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  const total = Number(count.rows[0]?.total ?? 0);
  return {
    items: result.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}
