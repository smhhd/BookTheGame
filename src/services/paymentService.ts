import { randomUUID } from "node:crypto";
import { transaction } from "../config/database";
import { env } from "../config/env";
import { bumpTicketCacheVersion, cacheDelete } from "../config/redis";
import { AppError } from "../utils/AppError";
import { syncTicketDocuments } from "../search/sync";

export async function pay(input: {
  userId: string;
  reservationId: number;
  method: "bank_card" | "wallet" | "crypto";
  simulateStatus: "SUCCESS" | "FAILED";
}) {
  if (env.NODE_ENV === "production" && input.simulateStatus !== "SUCCESS") {
    throw new AppError(400, "SIMULATION_DISABLED", "Payment simulation is disabled");
  }
  let changedTicketIds: string[] = [];
  const result = await transaction(async (client) => {
    const orderResult = await client.query<{
      order_id: string;
      user_id: string;
      status: string;
      reserved_until: Date;
    }>(
      `SELECT o.order_id, o.user_id, o.status, o.reserved_until
       FROM reservations requested
       JOIN orders o ON o.order_id = requested.order_id
       WHERE requested.reservation_id = $1
       FOR UPDATE OF o`,
      [input.reservationId]
    );
    const order = orderResult.rows[0];
    if (!order) throw new AppError(404, "RESERVATION_NOT_FOUND", "Reservation was not found");
    if (order.user_id !== input.userId) {
      throw new AppError(403, "NOT_RESERVATION_OWNER", "Reservation belongs to another user");
    }
    if (order.status === "paid") {
      throw new AppError(409, "ALREADY_PAID", "Order has already been paid");
    }
    if (order.status !== "pending") {
      throw new AppError(422, "ORDER_NOT_PAYABLE", "Order is not payable");
    }
    if (new Date(order.reserved_until).getTime() <= Date.now()) {
      throw new AppError(422, "RESERVATION_EXPIRED", "Reservation has expired");
    }
    const existing = await client.query(
      "SELECT 1 FROM payments WHERE order_id = $1 AND status = 'success'",
      [order.order_id]
    );
    if (existing.rowCount) throw new AppError(409, "ALREADY_PAID", "Order has already been paid");

    const items = await client.query<{ ticket_id: string; price_at_reservation: string }>(
      `SELECT rs.ticket_id, rs.price_at_reservation
       FROM reservations rs
       JOIN tickets t ON t.ticket_id = rs.ticket_id
       WHERE rs.order_id = $1 AND rs.status = 'pending'
       ORDER BY rs.ticket_id
       FOR UPDATE OF rs, t`,
      [order.order_id]
    );
    if (!items.rowCount) throw new AppError(422, "ORDER_NOT_PAYABLE", "Order has no payable items");
    const amount = items.rows.reduce(
      (sum, row) => sum + Number(row.price_at_reservation),
      0
    );
    const status = input.simulateStatus === "SUCCESS" ? "success" : "failed";
    if (status === "success" && input.method === "wallet") {
      const wallet = await client.query(
        `UPDATE users
         SET wallet_balance = wallet_balance - $2::numeric
         WHERE user_id = $1 AND wallet_balance >= $2::numeric
         RETURNING wallet_balance`,
        [input.userId, amount]
      );
      if (!wallet.rowCount) {
        throw new AppError(
          422,
          "INSUFFICIENT_WALLET_BALANCE",
          "Wallet balance is insufficient"
        );
      }
    }
    const payment = await client.query(
      `INSERT INTO payments (order_id, amount, method, status, paid_at, transaction_code)
       VALUES (
         $1,
         $2,
         $3,
         $4::varchar(20),
         CASE WHEN $4::varchar(20) = 'success' THEN CURRENT_TIMESTAMP END,
         $5
       )
       RETURNING payment_id, order_id, amount, method, status, paid_at, transaction_code`,
      [order.order_id, amount, input.method, status, `LOCAL-${randomUUID()}`]
    );
    if (status === "failed") return payment.rows[0];

    await client.query("UPDATE orders SET status = 'paid' WHERE order_id = $1", [
      order.order_id
    ]);
    await client.query(
      "UPDATE reservations SET status = 'paid' WHERE order_id = $1 AND status = 'pending'",
      [order.order_id]
    );
    await client.query(
      `UPDATE tickets SET status = 'sold'
       WHERE ticket_id = ANY($1::bigint[]) AND status = 'reserved'`,
      [items.rows.map((row) => row.ticket_id)]
    );
    changedTicketIds = items.rows.map((row) => row.ticket_id);
    return payment.rows[0];
  });
  if (input.simulateStatus === "SUCCESS") {
    await syncTicketDocuments(changedTicketIds);
    await bumpTicketCacheVersion();
    if (input.method === "wallet") await cacheDelete(`profile:${input.userId}`);
  }
  return result;
}
