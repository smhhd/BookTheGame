import { Router } from "express";
import * as controller from "../controllers/ticketController";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  ticketIdParamsSchema,
  ticketSearchSchema
} from "../validators/ticketValidators";

export const ticketRoutes = Router();
ticketRoutes.get("/", validate({ query: ticketSearchSchema }), asyncHandler(controller.search));
ticketRoutes.get(
  "/:ticketId",
  validate({ params: ticketIdParamsSchema }),
  asyncHandler(controller.details)
);
