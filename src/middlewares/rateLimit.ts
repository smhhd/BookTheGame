import rateLimit from "express-rate-limit";
import { env } from "../config/env";

function sensitiveEndpointLimiter(windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_request, response) => {
      response.status(429).json({
        success: false,
        message: "Too many requests; please try again later",
        error: { code: "RATE_LIMIT_EXCEEDED", details: [] }
      });
    }
  });
}

export const searchRateLimiter = sensitiveEndpointLimiter(
  60 * 1000,
  env.SEARCH_RATE_LIMIT_MAX
);
export const authRateLimiter = sensitiveEndpointLimiter(
  15 * 60 * 1000,
  env.AUTH_RATE_LIMIT_MAX
);
export const reservationRateLimiter = sensitiveEndpointLimiter(
  15 * 60 * 1000,
  env.RESERVATION_RATE_LIMIT_MAX
);
export const paymentRateLimiter = sensitiveEndpointLimiter(
  15 * 60 * 1000,
  env.PAYMENT_RATE_LIMIT_MAX
);
