import { Router } from "express";
import * as controller from "../controllers/reservationController";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { reservationRateLimiter } from "../middlewares/rateLimit";
import {
  cancellationSchema,
  createReservationSchema,
  reservationHistorySchema,
  reservationIdParamsSchema
} from "../validators/reservationValidators";

export const reservationRoutes = Router();
reservationRoutes.use(authenticate);
reservationRoutes.post(
  "/",
  reservationRateLimiter,
  validate({ body: createReservationSchema }),
  asyncHandler(controller.create)
);
reservationRoutes.get("/active", asyncHandler(controller.active));
reservationRoutes.get(
  "/history",
  validate({ query: reservationHistorySchema }),
  asyncHandler(controller.history)
);
reservationRoutes.get(
  "/:reservationId/cancellation-penalty",
  validate({ params: reservationIdParamsSchema }),
  asyncHandler(controller.penalty)
);
reservationRoutes.post(
  "/:reservationId/cancel",
  validate({ params: reservationIdParamsSchema, body: cancellationSchema }),
  asyncHandler(controller.cancel)
);
