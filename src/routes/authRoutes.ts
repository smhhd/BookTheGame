import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as controller from "../controllers/authController";
import { env } from "../config/env";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate";
import {
  otpRequestSchema,
  otpVerifySchema,
  signupSchema
} from "../validators/authValidators";

export const authRoutes = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

authRoutes.use(authLimiter);
authRoutes.post("/signup", validate({ body: signupSchema }), asyncHandler(controller.signup));
authRoutes.post(
  "/otp/request",
  validate({ body: otpRequestSchema }),
  asyncHandler(controller.requestOtp)
);
authRoutes.post(
  "/otp/verify",
  validate({ body: otpVerifySchema }),
  asyncHandler(controller.verifyOtp)
);
