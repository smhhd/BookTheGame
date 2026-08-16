import { transaction } from "../config/database";
import { bumpTicketCacheVersion } from "../config/redis";
import { env } from "../config/env";
import { syncTicketDocuments } from "../search/sync";

export async function expireReservations(batchSize = env.EXPIRATION_BATCH_SIZE) {
  const result = await transaction(async (client) => {
    const orders = await client.query<{ order_id: string }>(
      `SELECT order_id
       FROM orders
       WHERE status = 'pending' AND reserved_until <= CURRENT_TIMESTAMP
       ORDER BY reserved_until
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [batchSize]
    );
    if (!orders.rowCount) return { expiredOrders: 0, releasedTicketIds: [] as string[] };
    const orderIds = orders.rows.map((row) => row.order_id);
    const tickets = await client.query<{ ticket_id: string }>(
      `SELECT t.ticket_id
       FROM reservations rs
       JOIN tickets t ON t.ticket_id = rs.ticket_id
       WHERE rs.order_id = ANY($1::bigint[]) AND rs.status = 'pending'
       ORDER BY t.ticket_id
       FOR UPDATE OF rs, t`,
      [orderIds]
    );
    const ticketIds = tickets.rows.map((row) => row.ticket_id);
    await client.query(
      `UPDATE reservations SET status = 'expired'
       WHERE order_id = ANY($1::bigint[]) AND status = 'pending'`,
      [orderIds]
    );
    await client.query(
      `UPDATE tickets SET status = 'available'
       WHERE ticket_id = ANY($1::bigint[]) AND status = 'reserved'`,
      [ticketIds]
    );
    await client.query(
      `UPDATE orders SET status = 'expired'
       WHERE order_id = ANY($1::bigint[]) AND status = 'pending'`,
      [orderIds]
    );
    return { expiredOrders: orderIds.length, releasedTicketIds: ticketIds };
  });
  if (result.releasedTicketIds.length) {
    await syncTicketDocuments(result.releasedTicketIds);
    await bumpTicketCacheVersion();
  }
  return result;
}
