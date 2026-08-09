import { Router } from "express";
import * as controller from "../controllers/authController";
import { authRateLimiter } from "../middlewares/rateLimit";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate";
import {
  otpRequestSchema,
  otpVerifySchema,
  signupSchema
} from "../validators/authValidators";

export const authRoutes = Router();
authRoutes.use(authRateLimiter);
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
