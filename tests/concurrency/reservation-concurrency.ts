import { closeDatabase, query } from "../../src/config/database";
import { closeRedis } from "../../src/config/redis";
import { createReservation } from "../../src/services/reservationService";

async function main() {
  const ticketId = Number(process.env.CONCURRENCY_TICKET_ID);
  const userId = process.env.CONCURRENCY_USER_ID;
  if (!Number.isInteger(ticketId) || !userId) {
    throw new Error("Set CONCURRENCY_TICKET_ID and CONCURRENCY_USER_ID");
  }
  const before = await query<{ status: string; match_datetime: Date }>(
    `SELECT t.status, m.match_datetime FROM tickets t
     JOIN matches m ON m.match_id = t.match_id WHERE t.ticket_id = $1`,
    [ticketId]
  );
  if (before.rows[0]?.status !== "available" || before.rows[0].match_datetime <= new Date()) {
    throw new Error("The selected ticket must be available and belong to a future match");
  }
  const outcomes = await Promise.allSettled([
    createReservation(userId, [ticketId]),
    createReservation(userId, [ticketId])
  ]);
  const successes = outcomes.filter((outcome) => outcome.status === "fulfilled").length;
  const active = await query<{ count: string }>(
    `SELECT count(*)::text AS count FROM reservations
     WHERE ticket_id = $1 AND status IN ('pending','paid')`,
    [ticketId]
  );
  if (successes !== 1 || Number(active.rows[0]?.count) !== 1) {
    throw new Error(`Concurrency assertion failed: successes=${successes}`);
  }
  console.info("Concurrency test passed: exactly one reservation succeeded");
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => Promise.all([closeDatabase(), closeRedis()]));
