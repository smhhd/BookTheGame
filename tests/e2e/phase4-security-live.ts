import assert from "node:assert/strict";

const API = process.env.QA_API_URL ?? "http://127.0.0.1:13000";

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${API}${path}`, init);
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    // Some middleware errors intentionally have no JSON body.
  }
  return { response, body };
}

async function main(): Promise<void> {
  const signup = await request("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      firstName: "Security",
      lastName: "Runner",
      email: `security-${Date.now()}@example.com`,
      password: "StrongPass123"
    })
  });
  assert.equal(signup.response.status, 201);
  const authorization = `Bearer ${signup.body.data.token}`;

  const injection = await request(`/api/tickets?q=${encodeURIComponent("' OR 1=1 --")}`);
  assert.equal(injection.response.status, 200);
  assert.equal(injection.body.data.pagination.total, 0);

  const massAssignment = await request("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      firstName: "Mass",
      lastName: "Assignment",
      email: `mass-${Date.now()}@example.com`,
      password: "StrongPass123",
      role: "support"
    })
  });
  assert.equal(massAssignment.response.status, 400);

  const malformed = await request("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{bad json"
  });
  assert.equal(malformed.response.status, 400);

  const largeBody = await request("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ payload: "x".repeat(110_000) })
  });
  assert.equal(largeBody.response.status, 413);

  const disallowedCors = await request("/health", {
    headers: { origin: "https://evil.example" }
  });
  assert.equal(disallowedCors.response.headers.get("access-control-allow-origin"), null);
  const allowedCors = await request("/health", {
    headers: { origin: "http://localhost:15173" }
  });
  assert.equal(
    allowedCors.response.headers.get("access-control-allow-origin"),
    "http://localhost:15173"
  );
  assert.equal(injection.response.headers.get("x-content-type-options"), "nosniff");

  async function hitRateLimit(path: string, attempts: number, init?: RequestInit) {
    const statuses = new Map<number, number>();
    let controlledResponse: any = null;
    for (let index = 0; index < attempts; index += 1) {
      const result = await request(path, init);
      statuses.set(result.response.status, (statuses.get(result.response.status) ?? 0) + 1);
      if (result.response.status === 429) controlledResponse = result.body;
    }
    assert.ok((statuses.get(429) ?? 0) > 0);
    assert.equal(statuses.get(500) ?? 0, 0);
    assert.equal(controlledResponse?.error?.code, "RATE_LIMIT_EXCEEDED");
    return Object.fromEntries(statuses);
  }

  const searchRateStatuses = await hitRateLimit("/api/tickets?q=rate-limit", 50);
  const reservationRateStatuses = await hitRateLimit("/api/reservations", 45, {
    method: "POST",
    headers: { "content-type": "application/json", authorization },
    body: "{}"
  });
  const paymentRateStatuses = await hitRateLimit("/api/payments", 25, {
    method: "POST",
    headers: { "content-type": "application/json", authorization },
    body: "{}"
  });

  const rateStatuses = new Map<number, number>();
  for (let index = 0; index < 40; index += 1) {
    const result = await request("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    });
    rateStatuses.set(result.response.status, (rateStatuses.get(result.response.status) ?? 0) + 1);
  }
  assert.ok((rateStatuses.get(429) ?? 0) > 0);
  assert.equal(rateStatuses.get(500) ?? 0, 0);

  console.info(JSON.stringify({
    injectionTotal: injection.body.data.pagination.total,
    massAssignment: massAssignment.response.status,
    malformedJson: malformed.response.status,
    largeBody: largeBody.response.status,
    securityHeader: injection.response.headers.get("x-content-type-options"),
    disallowedCors: disallowedCors.response.headers.get("access-control-allow-origin"),
    allowedCors: allowedCors.response.headers.get("access-control-allow-origin"),
    authRateLimitStatuses: Object.fromEntries(rateStatuses),
    searchRateStatuses,
    reservationRateStatuses,
    paymentRateStatuses
  }));
  console.info("SUMMARY | PASS | live phase 4 security checks completed");
}

void main().catch((error) => {
  console.error("SUMMARY | FAIL", error);
  process.exitCode = 1;
});
