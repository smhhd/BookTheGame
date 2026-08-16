import express, { type RequestHandler } from "express";
import request from "supertest";
import {
  authRateLimiter,
  paymentRateLimiter,
  reservationRateLimiter,
  searchRateLimiter
} from "../../src/middlewares/rateLimit";

async function expectControlledLimit(limiter: RequestHandler, allowed: number) {
  const app = express();
  app.get("/", limiter, (_request, response) => response.json({ success: true }));

  for (let attempt = 0; attempt < allowed; attempt += 1) {
    await request(app).get("/").expect(200);
  }

  const limited = await request(app).get("/").expect(429);
  expect(limited.body).toEqual({
    success: false,
    message: "Too many requests; please try again later",
    error: { code: "RATE_LIMIT_EXCEEDED", details: [] }
  });
  expect(limited.headers["ratelimit"]).toBeDefined();
}

describe("sensitive endpoint rate limiting", () => {
  it("limits authentication with a controlled response", async () => {
    await expectControlledLimit(authRateLimiter, 30);
  });

  it("limits ticket search with a controlled response", async () => {
    await expectControlledLimit(searchRateLimiter, 120);
  });

  it("limits reservation creation with a controlled response", async () => {
    await expectControlledLimit(reservationRateLimiter, 60);
  });

  it("limits payment creation with a controlled response", async () => {
    await expectControlledLimit(paymentRateLimiter, 30);
  });
});
