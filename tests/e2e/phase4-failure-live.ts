import assert from "node:assert/strict";

const API = process.env.QA_API_URL ?? "http://127.0.0.1:13000";
const MODE = process.env.QA_FAILURE_MODE;

async function api(path: string, options: { method?: string; token?: string; body?: unknown } = {}) {
  const response = await fetch(`${API}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(45_000)
  });
  return { status: response.status, body: await response.json() as any };
}

async function main(): Promise<void> {
  assert.ok(MODE === "elastic" || MODE === "redis", "QA_FAILURE_MODE must be elastic or redis");
  const suffix = `${MODE}-${Date.now()}`;
  const signup = await api("/api/auth/signup", {
    method: "POST",
    body: {
      firstName: "Failure",
      lastName: "QA",
      email: `phase4-failure-${suffix}@example.com`,
      password: "StrongPass123"
    }
  });
  assert.equal(signup.status, 201);
  const token = String(signup.body.data.token);

  const search = await api("/api/tickets?remainingOnly=true&sortBy=ticketId&limit=1");
  assert.equal(search.status, 200);
  assert.equal(
    search.body.data.search.source,
    MODE === "elastic" ? "postgresql-fallback" : "elasticsearch"
  );
  const ticketId = Number(search.body.data.items[0].ticket_id);

  const reservation = await api("/api/reservations", {
    method: "POST",
    token,
    body: { ticketIds: [ticketId] }
  });
  assert.equal(reservation.status, 201);

  if (MODE === "elastic") {
    const health = await api("/health/search");
    assert.equal(health.status, 200);
    assert.equal(health.body.data.elasticsearch.available, false);
    assert.ok(health.body.data.synchronization.pendingCount >= 1);
    console.info(JSON.stringify({
      mode: MODE,
      searchSource: search.body.data.search.source,
      reservationStatus: reservation.status,
      pendingSync: health.body.data.synchronization.pendingCount,
      ticketId
    }));
  } else {
    const otp = await api("/api/auth/otp/request", {
      method: "POST",
      body: { identifier: `phase4-failure-${suffix}@example.com` }
    });
    assert.equal(otp.status, 503);
    console.info(JSON.stringify({
      mode: MODE,
      searchSource: search.body.data.search.source,
      reservationStatus: reservation.status,
      otpStatus: otp.status,
      ticketId
    }));
  }
  console.info(`SUMMARY | PASS | ${MODE} failure behavior completed`);
}

void main().catch((error) => {
  console.error("SUMMARY | FAIL", error);
  process.exitCode = 1;
});
