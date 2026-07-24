import { Router } from "express";
import * as controller from "../controllers/catalogController";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { venueQuerySchema } from "../validators/ticketValidators";

export const catalogRoutes = Router();
catalogRoutes.get("/cities", asyncHandler(controller.cities));
catalogRoutes.get(
  "/venues",
  validate({ query: venueQuerySchema }),
  asyncHandler(controller.venues)
);
