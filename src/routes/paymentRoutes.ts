import { Router } from "express";
import * as controller from "../controllers/paymentController";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { paymentRateLimiter } from "../middlewares/rateLimit";
import { paymentSchema } from "../validators/paymentValidators";

export const paymentRoutes = Router();
paymentRoutes.post(
  "/",
  authenticate,
  paymentRateLimiter,
  validate({ body: paymentSchema }),
  asyncHandler(controller.create)
);
