import { Router } from "express";
import * as controller from "../controllers/adminController";
import { authenticate, requireSupport } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  adminReservationListSchema,
  adminReservationParamsSchema,
  adminReservationStatusSchema,
  adminReservationTicketSchema
} from "../validators/adminValidators";
import {
  reportIdParamsSchema,
  reportListSchema,
  reportStatusSchema
} from "../validators/reportValidators";

export const adminRoutes = Router();
adminRoutes.use(authenticate, requireSupport);
adminRoutes.get("/reports", validate({ query: reportListSchema }), asyncHandler(controller.reports));
adminRoutes.get(
  "/reports/:id",
  validate({ params: reportIdParamsSchema }),
  asyncHandler(controller.report)
);
adminRoutes.patch(
  "/reports/:id/status",
  validate({ params: reportIdParamsSchema, body: reportStatusSchema }),
  asyncHandler(controller.reportStatus)
);
adminRoutes.get(
  "/reservations",
  validate({ query: adminReservationListSchema }),
  asyncHandler(controller.reservations)
);
adminRoutes.get(
  "/reservations/:id",
  validate({ params: adminReservationParamsSchema }),
  asyncHandler(controller.reservation)
);
adminRoutes.patch(
  "/reservations/:id/status",
  validate({ params: adminReservationParamsSchema, body: adminReservationStatusSchema }),
  asyncHandler(controller.reservationStatus)
);
adminRoutes.patch(
  "/reservations/:id/ticket",
  validate({ params: adminReservationParamsSchema, body: adminReservationTicketSchema }),
  asyncHandler(controller.reservationTicket)
);
adminRoutes.get("/payments/suspicious", asyncHandler(controller.suspiciousPayments));
