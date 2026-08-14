import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { Pool } from "pg";
import { createClient } from "redis";

const API = process.env.QA_API_URL ?? "http://127.0.0.1:13000";
const ELASTIC = process.env.QA_ELASTIC_URL ?? "http://127.0.0.1:19200";
const DATABASE_URL = process.env.QA_DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:15432/book_the_game";
const REDIS_URL = process.env.QA_REDIS_URL ?? "redis://127.0.0.1:16379";
const OTP_HASH_SECRET = "qa-only-otp-secret-at-least-32-characters";

interface ApiResponse {
  status: number;
  body: any;
}

async function api(
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {}
): Promise<ApiResponse> {
  const response = await fetch(`${API}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  return { status: response.status, body: await response.json() };
}

function pass(name: string, evidence: string): void {
  console.info(`PASS | ${name} | ${evidence}`);
}

async function replaceWithKnownOtp(
  redis: ReturnType<typeof createClient>,
  identifier: string,
  code: string
): Promise<void> {
  const normalized = identifier.toLowerCase();
  const namespace = normalized.includes("@") ? "email" : "phone";
  const hash = createHmac("sha256", OTP_HASH_SECRET)
    .update(`${normalized}:${code}`)
    .digest("hex");
  await redis.set(
    `otp:${namespace}:${normalized}`,
    JSON.stringify({ hash, attempts: 0, delivered: true }),
    { EX: 300 }
  );
}

async function main(): Promise<void> {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
  const pool = new Pool({
    connectionString: DATABASE_URL,
    options: "-c search_path=book_the_game,public"
  });
  const redis = createClient({ url: REDIS_URL });
  let closeAppDatabase: (() => Promise<void>) | undefined;
  let closeAppRedis: (() => Promise<void>) | undefined;
  await redis.connect();

  const signup = async (label: string) => {
    const email = `phase4-${label}-${suffix}@example.com`;
    const response = await api("/api/auth/signup", {
      method: "POST",
      body: {
        firstName: "Phase",
        lastName: label,
        email,
        password: "StrongPass123"
      }
    });
    assert.equal(response.status, 201);
    return {
      email,
      token: String(response.body.data.token),
      userId: String(response.body.data.user.user_id)
    };
  };

  try {
    const health = await api("/health/search");
    assert.equal(health.status, 200);
    assert.equal(health.body.data.elasticsearch.available, true);
    pass("search health", `cluster=${health.body.data.elasticsearch.clusterName}`);

    const invalidSignup = await api("/api/auth/signup", {
      method: "POST",
      body: { firstName: "Bad", lastName: "Input", email: "invalid", password: "weak" }
    });
    assert.equal(invalidSignup.status, 400);
    pass("signup validation", "invalid payload rejected with 400");

    const userA = await signup("A");
    const userB = await signup("B");
    const duplicate = await api("/api/auth/signup", {
      method: "POST",
      body: {
        firstName: "Duplicate",
        lastName: "User",
        email: userA.email,
        password: "StrongPass123"
      }
    });
    assert.equal(duplicate.status, 409);
    pass("signup and duplicate protection", "two users created; duplicate rejected with 409");

    const otpRequest = await api("/api/auth/otp/request", {
      method: "POST",
      body: { identifier: userA.email }
    });
    assert.equal(otpRequest.status, 200);
    assert.deepEqual(otpRequest.body.data, { expiresInSeconds: 300 });
    const otp = "123456";
    await replaceWithKnownOtp(redis, userA.email, otp);
    const otpKey = `otp:email:${userA.email.toLowerCase()}`;
    const otpTtl = await redis.ttl(otpKey);
    assert.ok(otpTtl > 0 && otpTtl <= 300, `unexpected OTP TTL: ${otpTtl}`);
    const otpVerify = await api("/api/auth/otp/verify", {
      method: "POST",
      body: { identifier: userA.email, otp }
    });
    assert.equal(otpVerify.status, 200);
    const otpReuse = await api("/api/auth/otp/verify", {
      method: "POST",
      body: { identifier: userA.email, otp }
    });
    assert.equal(otpReuse.status, 401);
    pass("OTP TTL and one-time use", `ttl=${otpTtl}; reuse rejected`);

    const noToken = await api("/api/reservations/active");
    assert.equal(noToken.status, 401);
    const spectatorAdmin = await api("/api/admin/reports", { token: userA.token });
    assert.equal(spectatorAdmin.status, 403);
    pass("authentication and role guard", "private=401; spectator admin=403");

    await redis.flushDb();
    const searchUrl = "/api/tickets?remainingOnly=false&sport=Football&cityId=1&sortBy=price&sortOrder=asc&page=1&limit=5";
    let searchFirst = await api(searchUrl);
    for (let attempt = 1; attempt < 3 && searchFirst.body?.data?.search?.source !== "elasticsearch"; attempt += 1) {
      await redis.flushDb();
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      searchFirst = await api(searchUrl);
    }
    assert.equal(searchFirst.status, 200);
    assert.equal(searchFirst.body.data.search.source, "elasticsearch");
    assert.ok(searchFirst.body.data.items.every((item: any) =>
      item.sport_type === "Football" && item.city_id === 1
    ));
    const prices = searchFirst.body.data.items.map((item: any) => Number(item.price));
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
    const cacheKeys = await redis.keys("tickets:search:*");
    assert.equal(cacheKeys.length, 1);
    const cacheTtl = await redis.ttl(cacheKeys[0]!);
    assert.ok(cacheTtl > 0 && cacheTtl <= 30);
    const searchSecond = await api(searchUrl);
    assert.equal(searchSecond.body.data.cacheHit, true);
    pass("Elasticsearch filters, sort and Redis cache", `items=${prices.length}; ttl=${cacheTtl}`);

    const pageOne = await api("/api/tickets?remainingOnly=false&sortBy=ticketId&page=1&limit=5");
    const pageTwo = await api("/api/tickets?remainingOnly=false&sortBy=ticketId&page=2&limit=5");
    const searchableTicketCount = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM tickets t
       JOIN matches m ON m.match_id = t.match_id
       JOIN sport_types st ON st.sport_type_id = m.sport_type_id
       JOIN teams ht ON ht.team_id = m.home_team_id
       JOIN teams at ON at.team_id = m.away_team_id
       JOIN venues v ON v.venue_id = t.venue_id
       JOIN cities c ON c.city_id = v.city_id
       JOIN ticket_categories tc ON tc.category_id = t.category_id
       JOIN seats s ON s.seat_id = t.seat_id`
    );
    const expectedSearchableTickets = Number(searchableTicketCount.rows[0]!.count);
    const elasticCountResponse = await fetch(`${ELASTIC}/book_the_game_tickets_v1/_count`);
    assert.equal(elasticCountResponse.status, 200);
    const elasticCount = await elasticCountResponse.json() as { count: number };
    const firstIds = new Set(pageOne.body.data.items.map((item: any) => item.ticket_id));
    assert.ok(pageTwo.body.data.items.every((item: any) => !firstIds.has(item.ticket_id)));
    assert.equal(pageOne.body.data.pagination.total, expectedSearchableTickets);
    assert.equal(elasticCount.count, expectedSearchableTickets);
    assert.equal((await api("/api/tickets?page=0")).status, 400);
    assert.equal((await api("/api/tickets?limit=101")).status, 400);
    assert.equal((await api("/api/tickets?q=definitely-no-result")).body.data.items.length, 0);
    pass("pagination and invalid search input", "stable pages; invalid bounds=400; empty result=[]");

    const available = await api("/api/tickets?remainingOnly=true&sortBy=ticketId&limit=5");
    const ticketIds = available.body.data.items.map((item: any) => Number(item.ticket_id));
    assert.equal(ticketIds.length, 5);
    const attempts = ticketIds.flatMap((ticketId: number) => [userA, userB].map((user) =>
      api("/api/reservations", {
        method: "POST",
        token: user.token,
        body: { ticketIds: [ticketId] }
      }).then((result) => ({ ...result, ticketId, user }))
    ));
    const concurrency = await Promise.all(attempts);
    assert.ok(concurrency.every((result) => [201, 409].includes(result.status)));
    const winners = concurrency.filter((result) => result.status === 201);
    assert.equal(winners.length, 5);
    const activeByTicket = await pool.query<{ ticket_id: string; count: string }>(
      `SELECT ticket_id, count(*)::text AS count
       FROM reservations
       WHERE ticket_id = ANY($1::bigint[]) AND status IN ('pending','paid')
       GROUP BY ticket_id`,
      [ticketIds]
    );
    assert.equal(activeByTicket.rows.length, 5);
    assert.ok(activeByTicket.rows.every((row) => row.count === "1"));
    pass("reservation concurrency", "10 parallel requests / 5 tickets => exactly 5 successes");

    const paidWinner = winners[0]!;
    const paidReservationId = Number(paidWinner.body.data.reservations[0].reservation_id);
    const otherUser = paidWinner.user.userId === userA.userId ? userB : userA;
    const idorPenalty = await api(`/api/reservations/${paidReservationId}/cancellation-penalty`, {
      token: otherUser.token
    });
    assert.equal(idorPenalty.status, 403);
    const idorPayment = await api("/api/payments", {
      method: "POST",
      token: otherUser.token,
      body: { reservationId: paidReservationId, method: "bank_card", simulateStatus: "SUCCESS" }
    });
    assert.equal(idorPayment.status, 403);
    const payment = await api("/api/payments", {
      method: "POST",
      token: paidWinner.user.token,
      body: { reservationId: paidReservationId, method: "bank_card", simulateStatus: "SUCCESS" }
    });
    assert.equal(payment.status, 201, JSON.stringify(payment.body));
    assert.equal(payment.body.data.status, "success");
    const duplicatePayment = await api("/api/payments", {
      method: "POST",
      token: paidWinner.user.token,
      body: { reservationId: paidReservationId, method: "bank_card", simulateStatus: "SUCCESS" }
    });
    assert.equal(duplicatePayment.status, 409);
    pass("payment and IDOR", "owner paid once; foreign user=403; duplicate=409");

    const penalty = await api(`/api/reservations/${paidReservationId}/cancellation-penalty`, {
      token: paidWinner.user.token
    });
    assert.equal(penalty.status, 200);
    const cancelled = await api(`/api/reservations/${paidReservationId}/cancel`, {
      method: "POST",
      token: paidWinner.user.token,
      body: { reason: "QA cancellation test" }
    });
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.body.data.alreadyCancelled, false);
    const cancelledAgain = await api(`/api/reservations/${paidReservationId}/cancel`, {
      method: "POST",
      token: paidWinner.user.token,
      body: { reason: "QA cancellation test again" }
    });
    assert.equal(cancelledAgain.status, 200);
    assert.equal(cancelledAgain.body.data.alreadyCancelled, true);
    const cancelledTicket = await pool.query<{ status: string }>(
      "SELECT status FROM tickets WHERE ticket_id = $1",
      [paidWinner.ticketId]
    );
    assert.equal(cancelledTicket.rows[0]!.status, "available");
    pass("cancellation idempotency", `penalty=${penalty.body.data.penaltyPercent}; capacity released once`);

    const expiring = winners.slice(1);
    const expiringOrderIds = expiring.map((winner) => Number(winner.body.data.orderId));
    await pool.query(
      `UPDATE orders
       SET reserved_at = CURRENT_TIMESTAMP - INTERVAL '2 minutes',
           reserved_until = CURRENT_TIMESTAMP - INTERVAL '1 minute'
       WHERE order_id = ANY($1::bigint[])`,
      [expiringOrderIds]
    );
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = DATABASE_URL;
    process.env.REDIS_URL = REDIS_URL;
    process.env.ELASTICSEARCH_NODE = ELASTIC;
    process.env.ELASTICSEARCH_INDEX = "book_the_game_tickets_v1";
    process.env.ELASTICSEARCH_REQUEST_TIMEOUT_MS = "30000";
    process.env.JWT_SECRET = "qa-only-jwt-secret-at-least-32-characters";
    process.env.OTP_HASH_SECRET = OTP_HASH_SECRET;
    process.env.SMTP_USER = "qa-sender@example.com";
    process.env.SMTP_PASS = "qa-only-smtp-password";
    process.env.SMTP_FROM_EMAIL = "qa-sender@example.com";
    const { expireReservations } = await import("../../src/services/expirationService");
    closeAppDatabase = (await import("../../src/config/database")).closeDatabase;
    closeAppRedis = (await import("../../src/config/redis")).closeRedis;
    const expirationRuns = await Promise.all([expireReservations(100), expireReservations(100)]);
    assert.equal(expirationRuns.reduce((sum, result) => sum + result.expiredOrders, 0), expiring.length);
    const expirationRepeat = await expireReservations(100);
    assert.equal(expirationRepeat.expiredOrders, 0);
    const expiredReservationId = Number(expiring[0]!.body.data.reservations[0].reservation_id);
    const payExpired = await api("/api/payments", {
      method: "POST",
      token: expiring[0]!.user.token,
      body: { reservationId: expiredReservationId, method: "bank_card", simulateStatus: "SUCCESS" }
    });
    assert.equal(payExpired.status, 422);
    pass("expiration job", `${expiring.length} orders expired once; payment rejected`);

    const report = await api("/api/reports", {
      method: "POST",
      token: paidWinner.user.token,
      body: {
        categoryId: 1,
        reservationId: paidReservationId,
        description: "QA report for a completed cancellation flow"
      }
    });
    assert.equal(report.status, 201);
    const foreignReport = await api("/api/reports", {
      method: "POST",
      token: otherUser.token,
      body: {
        categoryId: 1,
        reservationId: paidReservationId,
        description: "Attempt to report another user's reservation"
      }
    });
    assert.equal(foreignReport.status, 403);

    const supportOtpRequest = await api("/api/auth/otp/request", {
      method: "POST",
      body: { identifier: "support1@example.com" }
    });
    assert.equal(supportOtpRequest.status, 200);
    assert.deepEqual(supportOtpRequest.body.data, { expiresInSeconds: 300 });
    const supportOtp = "654321";
    await replaceWithKnownOtp(redis, "support1@example.com", supportOtp);
    const supportLogin = await api("/api/auth/otp/verify", {
      method: "POST",
      body: { identifier: "support1@example.com", otp: supportOtp }
    });
    assert.equal(supportLogin.status, 200);
    const supportToken = String(supportLogin.body.data.token);
    const adminReports = await api("/api/admin/reports?status=pending", { token: supportToken });
    assert.equal(adminReports.status, 200);
    const reportId = Number(report.body.data.report_id);
    const reviewed = await api(`/api/admin/reports/${reportId}/status`, {
      method: "PATCH",
      token: supportToken,
      body: { status: "reviewed", response: "QA review complete" }
    });
    assert.equal(reviewed.status, 200);
    pass("reports and support authorization", "ownership enforced; support review succeeded");

    for (const ticketId of ticketIds) {
      const database = await pool.query<{ status: string; price: string }>(
        "SELECT status, price::text FROM tickets WHERE ticket_id = $1",
        [ticketId]
      );
      const documentResponse = await fetch(`${ELASTIC}/book_the_game_tickets_v1/_doc/${ticketId}`);
      assert.equal(documentResponse.status, 200);
      const document: any = await documentResponse.json();
      assert.equal(document._source.status, database.rows[0]!.status);
      assert.equal(Number(document._source.price), Number(database.rows[0]!.price));
    }
    const duplicateActive = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM (
         SELECT ticket_id FROM reservations
         WHERE status IN ('pending','paid') GROUP BY ticket_id HAVING count(*) > 1
       ) duplicates`
    );
    assert.equal(duplicateActive.rows[0]!.count, "0");
    pass("PostgreSQL/Elasticsearch consistency", "five changed tickets match; no duplicate active booking");

    console.info("SUMMARY | PASS | live phase 4 E2E completed");
  } finally {
    await Promise.allSettled([
      pool.end(),
      redis.quit(),
      ...(closeAppDatabase ? [closeAppDatabase()] : []),
      ...(closeAppRedis ? [closeAppRedis()] : [])
    ]);
  }
}

void main().catch((error) => {
  console.error("SUMMARY | FAIL", error);
  process.exitCode = 1;
});
