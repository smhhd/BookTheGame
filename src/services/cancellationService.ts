import { PoolClient } from "pg";
import { transaction } from "../config/database";
import { bumpTicketCacheVersion, cacheDelete } from "../config/redis";
import { RoleName } from "../types";
import { AppError } from "../utils/AppError";

interface PenaltyRow {
  reservation_id: string;
  order_id: string;
  user_id: string;
  reservation_status: string;
  ticket_id: string;
  match_id: string;
  match_datetime: Date;
  organizer_id: string;
  sport_type_id: number;
  price_at_reservation: string;
  policy_id: string | null;
  rule_id: string | null;
  penalty_percent: string;
}

async function getPenaltyRow(
  client: Pick<PoolClient, "query">,
  reservationId: number,
  lock = false
): Promise<PenaltyRow | null> {
  const result = await client.query<PenaltyRow>(
    `SELECT
       rs.reservation_id, rs.order_id, o.user_id, rs.status AS reservation_status,
       rs.ticket_id, m.match_id, m.match_datetime, m.organizer_id, m.sport_type_id,
       rs.price_at_reservation, cp.policy_id, rule.rule_id,
       COALESCE(rule.penalty_percent, 0)::text AS penalty_percent
     FROM reservations rs
     JOIN orders o ON o.order_id = rs.order_id
     JOIN tickets t ON t.ticket_id = rs.ticket_id
     JOIN matches m ON m.match_id = t.match_id
     LEFT JOIN cancellation_policies cp
       ON cp.organizer_id = m.organizer_id
      AND cp.sport_type_id = m.sport_type_id
      AND cp.status = 'active'
     LEFT JOIN LATERAL (
       SELECT cpr.rule_id, cpr.penalty_percent
       FROM cancellation_policy_rules cpr
       WHERE cpr.policy_id = cp.policy_id
         AND EXTRACT(EPOCH FROM (m.match_datetime - CURRENT_TIMESTAMP)) / 3600
             >= cpr.min_hours_before_match
         AND (
           cpr.max_hours_before_match IS NULL
           OR EXTRACT(EPOCH FROM (m.match_datetime - CURRENT_TIMESTAMP)) / 3600
              < cpr.max_hours_before_match
         )
       ORDER BY cpr.min_hours_before_match DESC
       LIMIT 1
     ) rule ON true
     WHERE rs.reservation_id = $1
     ${lock ? "FOR UPDATE OF o, rs, t" : ""}`,
    [reservationId]
  );
  return result.rows[0] ?? null;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculate(row: PenaltyRow) {
  const originalAmount = Number(row.price_at_reservation);
  const penaltyPercent = Number(row.penalty_percent);
  const penaltyAmount = roundMoney((originalAmount * penaltyPercent) / 100);
  return {
    reservationId: row.reservation_id,
    originalAmount,
    penaltyPercent,
    penaltyAmount,
    refundableAmount: roundMoney(originalAmount - penaltyAmount),
    policyId: row.policy_id,
    ruleId: row.rule_id,
    reason: row.rule_id
      ? `Cancellation policy rule ${row.rule_id} applies`
      : "No matching active policy rule; zero penalty applies"
  };
}

function assertOwner(row: PenaltyRow, userId: string, role: RoleName) {
  if (role !== "support" && row.user_id !== userId) {
    throw new AppError(403, "NOT_RESERVATION_OWNER", "Reservation belongs to another user");
  }
}

export async function previewPenalty(
  reservationId: number,
  userId: string,
  role: RoleName
) {
  const { query } = await import("../config/database");
  const row = await getPenaltyRow({ query } as Pick<PoolClient, "query">, reservationId);
  if (!row) throw new AppError(404, "RESERVATION_NOT_FOUND", "Reservation was not found");
  assertOwner(row, userId, role);
  if (new Date(row.match_datetime).getTime() <= Date.now()) {
    throw new AppError(422, "MATCH_ALREADY_STARTED", "A started match cannot be cancelled");
  }
  return calculate(row);
}

export async function cancel(
  reservationId: number,
  userId: string,
  role: RoleName,
  reason?: string
) {
  let refundedUserId: string | undefined;
  const result = await transaction(async (client) => {
    const row = await getPenaltyRow(client, reservationId, true);
    if (!row) throw new AppError(404, "RESERVATION_NOT_FOUND", "Reservation was not found");
    assertOwner(row, userId, role);
    if (row.reservation_status === "cancelled") {
      const existing = await client.query(
        `SELECT cr.request_id, cri.refund_amount, rf.refund_id, rf.status AS refund_status
         FROM cancellation_request_items cri
         JOIN cancellation_requests cr ON cr.request_id = cri.request_id
         LEFT JOIN refunds rf ON rf.cancellation_request_id = cr.request_id
         WHERE cri.reservation_id = $1 AND cr.status = 'approved'
         ORDER BY cr.request_id DESC LIMIT 1`,
        [reservationId]
      );
      return { alreadyCancelled: true, ...existing.rows[0] };
    }
    if (!["pending", "paid"].includes(row.reservation_status)) {
      throw new AppError(422, "RESERVATION_NOT_CANCELLABLE", "Reservation cannot be cancelled");
    }
    if (new Date(row.match_datetime).getTime() <= Date.now()) {
      throw new AppError(422, "MATCH_ALREADY_STARTED", "A started match cannot be cancelled");
    }

    const penalty = calculate(row);
    const request = await client.query<{ request_id: string }>(
      `INSERT INTO cancellation_requests (
         order_id, user_id, request_type, reason, status,
         reviewed_by_support_id, reviewed_at
       )
       VALUES (
         $1, $2, 'single_ticket', $3, 'approved',
         CASE WHEN $4::boolean THEN $5::bigint END,
         CASE WHEN $4::boolean THEN CURRENT_TIMESTAMP END
       )
       RETURNING request_id`,
      [row.order_id, row.user_id, reason ?? null, role === "support", userId]
    );
    const requestId = request.rows[0]!.request_id;
    const hasPolicyRule = row.policy_id !== null && row.rule_id !== null;
    await client.query(
      `INSERT INTO cancellation_request_items (
         request_id, order_id, request_type, reservation_id, ticket_id, match_id,
         item_action, policy_id, policy_rule_id, organizer_id, sport_type_id,
         penalty_percent_applied, refund_amount, status
       )
       VALUES (
         $1, $2, 'single_ticket', $3, $4, $5, 'cancel',
         $6, $7, $8, $9, $10, $11, 'approved'
       )`,
      [
        requestId,
        row.order_id,
        row.reservation_id,
        row.ticket_id,
        row.match_id,
        hasPolicyRule ? row.policy_id : null,
        hasPolicyRule ? row.rule_id : null,
        hasPolicyRule ? row.organizer_id : null,
        hasPolicyRule ? row.sport_type_id : null,
        penalty.penaltyPercent,
        row.reservation_status === "paid" ? penalty.refundableAmount : 0
      ]
    );

    let refund = null;
    if (row.reservation_status === "paid") {
      const payment = await client.query<{ payment_id: string }>(
        `SELECT payment_id FROM payments
         WHERE order_id = $1 AND status = 'success'
         ORDER BY payment_id DESC LIMIT 1 FOR UPDATE`,
        [row.order_id]
      );
      if (!payment.rows[0]) {
        throw new AppError(422, "SUCCESS_PAYMENT_NOT_FOUND", "Successful payment was not found");
      }
      const inserted = await client.query(
        `INSERT INTO refunds (
           payment_id, cancellation_request_id, order_id, amount, status, refunded_at
         )
         VALUES ($1, $2, $3, $4, 'success', CURRENT_TIMESTAMP)
         RETURNING refund_id, amount, status, refunded_at`,
        [payment.rows[0].payment_id, requestId, row.order_id, penalty.refundableAmount]
      );
      const wallet = await client.query<{ wallet_balance: string }>(
        `UPDATE users
         SET wallet_balance = wallet_balance + $2::numeric
         WHERE user_id = $1
         RETURNING wallet_balance`,
        [row.user_id, penalty.refundableAmount]
      );
      refund = {
        ...inserted.rows[0],
        walletBalance: wallet.rows[0]!.wallet_balance
      };
      refundedUserId = row.user_id;
    }

    await client.query(
      `UPDATE reservations
       SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
       WHERE reservation_id = $1`,
      [reservationId]
    );
    await client.query("UPDATE tickets SET status = 'available' WHERE ticket_id = $1", [
      row.ticket_id
    ]);
    const remaining = await client.query<{
      pending_count: string;
      paid_count: string;
    }>(
      `SELECT
         count(*) FILTER (WHERE status = 'pending')::text AS pending_count,
         count(*) FILTER (WHERE status = 'paid')::text AS paid_count
       FROM reservations
       WHERE order_id = $1`,
      [row.order_id]
    );
    const pendingCount = Number(remaining.rows[0]?.pending_count ?? 0);
    const paidCount = Number(remaining.rows[0]?.paid_count ?? 0);
    const remainingCount = pendingCount + paidCount;
    const nextOrderStatus =
      remainingCount === 0
        ? "cancelled"
        : row.reservation_status === "pending" && paidCount === 0
          ? "pending"
          : "partially_cancelled";
    await client.query(
      `UPDATE orders SET status = $2 WHERE order_id = $1`,
      [row.order_id, nextOrderStatus]
    );
    if (row.reservation_status === "paid" && remainingCount === 0) {
      await client.query(
        "UPDATE payments SET status = 'refunded' WHERE order_id = $1 AND status = 'success'",
        [row.order_id]
      );
    }
    return { requestId, penalty, refund, alreadyCancelled: false };
  });
  await bumpTicketCacheVersion();
  if (refundedUserId) await cacheDelete(`profile:${refundedUserId}`);
  return result;
}
