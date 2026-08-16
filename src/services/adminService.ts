import { query, transaction } from "../config/database";
import { bumpTicketCacheVersion } from "../config/redis";
import { AppError } from "../utils/AppError";
import { cancel } from "./cancellationService";
import { syncTicketDocuments } from "../search/sync";

export async function listReservations(input: {
  status?: string;
  page: number;
  limit: number;
}) {
  const values: unknown[] = [];
  const where = input.status ? `WHERE rs.status = $${values.push(input.status)}` : "";
  const count = await query<{ total: string }>(
    `SELECT count(*)::text AS total FROM reservations rs ${where}`,
    values
  );
  values.push(input.limit, (input.page - 1) * input.limit);
  const result = await query(
    `SELECT rs.*, o.user_id, o.status AS order_status, o.reserved_until,
            t.status AS ticket_status, m.match_datetime,
            u.first_name, u.last_name, u.email, u.phone
     FROM reservations rs
     JOIN orders o ON o.order_id = rs.order_id
     JOIN users u ON u.user_id = o.user_id
     JOIN tickets t ON t.ticket_id = rs.ticket_id
     JOIN matches m ON m.match_id = t.match_id
     ${where}
     ORDER BY rs.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
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

export async function reservationDetails(id: number) {
  const result = await query(
    `SELECT rs.*, o.user_id, o.status AS order_status, o.reserved_until,
            t.status AS ticket_status, t.price, m.match_datetime,
            ht.name AS home_team, at.name AS away_team, v.name AS venue_name,
            p.payment_id, p.status AS payment_status, p.amount AS payment_amount
     FROM reservations rs
     JOIN orders o ON o.order_id = rs.order_id
     JOIN tickets t ON t.ticket_id = rs.ticket_id
     JOIN matches m ON m.match_id = t.match_id
     JOIN teams ht ON ht.team_id = m.home_team_id
     JOIN teams at ON at.team_id = m.away_team_id
     JOIN venues v ON v.venue_id = t.venue_id
     LEFT JOIN payments p ON p.order_id = o.order_id AND p.status IN ('success','refunded')
     WHERE rs.reservation_id = $1`,
    [id]
  );
  if (!result.rows[0]) {
    throw new AppError(404, "RESERVATION_NOT_FOUND", "Reservation was not found");
  }
  return result.rows[0];
}

export async function setReservationStatus(id: number, status: string, supportId: string) {
  if (status === "cancelled") return cancel(id, supportId, "support", "Cancelled by support");
  let changedTicketIds: string[] = [];
  const result = await transaction(async (client) => {
    const locked = await client.query<{
      status: string;
      order_id: string;
      ticket_id: string;
    }>(
      `SELECT rs.status, rs.order_id, rs.ticket_id
       FROM reservations rs
       JOIN orders o ON o.order_id = rs.order_id
       JOIN tickets t ON t.ticket_id = rs.ticket_id
       WHERE rs.reservation_id = $1
       FOR UPDATE OF o, rs, t`,
      [id]
    );
    const row = locked.rows[0];
    if (!row) throw new AppError(404, "RESERVATION_NOT_FOUND", "Reservation was not found");
    if (row.status !== "pending") {
      throw new AppError(422, "INVALID_STATUS_TRANSITION", "Only pending reservations can change");
    }
    if (status === "paid") {
      const payment = await client.query(
        "SELECT 1 FROM payments WHERE order_id = $1 AND status = 'success'",
        [row.order_id]
      );
      if (!payment.rowCount) {
        throw new AppError(422, "SUCCESS_PAYMENT_NOT_FOUND", "Successful payment is required");
      }
      await client.query(
        "UPDATE reservations SET status = 'paid' WHERE order_id = $1 AND status = 'pending'",
        [row.order_id]
      );
      const updatedTickets = await client.query<{ ticket_id: string }>(
        `UPDATE tickets SET status = 'sold'
         WHERE ticket_id IN (
           SELECT ticket_id FROM reservations WHERE order_id = $1 AND status = 'paid'
         ) RETURNING ticket_id`,
        [row.order_id]
      );
      changedTicketIds = updatedTickets.rows.map((ticket) => ticket.ticket_id);
      await client.query("UPDATE orders SET status = 'paid' WHERE order_id = $1", [
        row.order_id
      ]);
    } else {
      await client.query("UPDATE reservations SET status = 'expired' WHERE reservation_id = $1", [
        id
      ]);
      await client.query("UPDATE tickets SET status = 'available' WHERE ticket_id = $1", [
        row.ticket_id
      ]);
      changedTicketIds = [row.ticket_id];
      await client.query(
        `UPDATE orders SET status = 'expired'
         WHERE order_id = $1
           AND NOT EXISTS (
             SELECT 1 FROM reservations
             WHERE order_id = $1 AND status IN ('pending','paid')
           )`,
        [row.order_id]
      );
    }
    return { reservationId: id, status, reviewedBy: supportId };
  });
  await syncTicketDocuments(changedTicketIds);
  await bumpTicketCacheVersion();
  return result;
}

export async function changeReservationTicket(
  id: number,
  ticketId: number,
  supportId: string
) {
  const result = await transaction(async (client) => {
    const reference = await client.query<{ order_id: string }>(
      "SELECT order_id FROM reservations WHERE reservation_id = $1",
      [id]
    );
    const orderId = reference.rows[0]?.order_id;
    if (!orderId) throw new AppError(404, "RESERVATION_NOT_FOUND", "Reservation was not found");

    const order = await client.query<{ status: string; reserved_until: Date }>(
      "SELECT status, reserved_until FROM orders WHERE order_id = $1 FOR UPDATE",
      [orderId]
    );
    if (order.rows[0]?.status !== "pending") {
      throw new AppError(422, "ORDER_NOT_MODIFIABLE", "Only pending orders can change tickets");
    }
    if (new Date(order.rows[0].reserved_until).getTime() <= Date.now()) {
      throw new AppError(422, "RESERVATION_EXPIRED", "Reservation has expired");
    }

    const reservation = await client.query<{
      status: string;
      ticket_id: string;
    }>(
      `SELECT status, ticket_id
       FROM reservations
       WHERE reservation_id = $1 AND order_id = $2
       FOR UPDATE`,
      [id, orderId]
    );
    const row = reservation.rows[0];
    if (!row) throw new AppError(404, "RESERVATION_NOT_FOUND", "Reservation was not found");
    if (row.status !== "pending") {
      throw new AppError(
        422,
        "INVALID_STATUS_TRANSITION",
        "Only pending reservations can change tickets"
      );
    }

    const tickets = await client.query<{
      ticket_id: string;
      match_id: string;
      price: string;
      status: string;
    }>(
      `SELECT ticket_id, match_id, price, status
       FROM tickets
       WHERE ticket_id = ANY($1::bigint[])
       ORDER BY ticket_id
       FOR UPDATE`,
      [[row.ticket_id, ticketId]]
    );
    const oldTicket = tickets.rows.find((ticket) => ticket.ticket_id === row.ticket_id);
    const newTicket = tickets.rows.find((ticket) => ticket.ticket_id === String(ticketId));
    if (!newTicket) throw new AppError(404, "TICKET_NOT_FOUND", "Ticket was not found");
    if (!oldTicket || oldTicket.status !== "reserved") {
      throw new AppError(
        409,
        "RESERVATION_TICKET_INCONSISTENT",
        "The reservation ticket is not reserved"
      );
    }
    if (newTicket.status !== "available") {
      throw new AppError(409, "TICKET_UNAVAILABLE", "Replacement ticket is unavailable");
    }
    if (newTicket.match_id !== oldTicket.match_id) {
      throw new AppError(
        422,
        "TICKET_MATCH_MISMATCH",
        "Replacement ticket must belong to the same match"
      );
    }

    const reserved = await client.query(
      "UPDATE tickets SET status = 'reserved' WHERE ticket_id = $1 AND status = 'available'",
      [ticketId]
    );
    if (reserved.rowCount !== 1) {
      throw new AppError(409, "TICKET_UNAVAILABLE", "Replacement ticket is unavailable");
    }
    await client.query(
      `UPDATE reservations
       SET ticket_id = $2, price_at_reservation = $3
       WHERE reservation_id = $1 AND status = 'pending'`,
      [id, ticketId, newTicket.price]
    );
    const released = await client.query(
      "UPDATE tickets SET status = 'available' WHERE ticket_id = $1 AND status = 'reserved'",
      [row.ticket_id]
    );
    if (released.rowCount !== 1) {
      throw new AppError(
        409,
        "RESERVATION_TICKET_INCONSISTENT",
        "The reservation ticket could not be released"
      );
    }
    return {
      reservationId: id,
      oldTicketId: row.ticket_id,
      ticketId,
      priceAtReservation: newTicket.price,
      status: "pending",
      reviewedBy: supportId
    };
  });
  await syncTicketDocuments([result.oldTicketId, result.ticketId]);
  await bumpTicketCacheVersion();
  return result;
}

export async function suspiciousPayments() {
  const result = await query(
    `WITH totals AS (
       SELECT o.order_id, COALESCE(sum(rs.price_at_reservation), 0) AS expected_amount
       FROM orders o LEFT JOIN reservations rs ON rs.order_id = o.order_id
       GROUP BY o.order_id
     ), attempts AS (
       SELECT order_id, count(*) AS attempt_count
       FROM payments GROUP BY order_id
     )
     SELECT p.*, t.expected_amount, a.attempt_count,
            ARRAY_REMOVE(ARRAY[
              CASE WHEN p.status = 'failed' THEN 'failed_payment' END,
              CASE WHEN p.amount <> t.expected_amount THEN 'amount_mismatch' END,
              CASE WHEN a.attempt_count > 1 THEN 'multiple_attempts' END
            ], NULL) AS reasons
     FROM payments p
     JOIN totals t ON t.order_id = p.order_id
     JOIN attempts a ON a.order_id = p.order_id
     WHERE p.status = 'failed'
        OR p.amount <> t.expected_amount
        OR a.attempt_count > 1
     ORDER BY p.payment_id DESC`
  );
  return result.rows;
}
