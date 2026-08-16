import { Router } from "express";
import * as controller from "../controllers/catalogController";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  competitionIdParamsSchema,
  matchIdParamsSchema,
  venueQuerySchema,
} from "../validators/ticketValidators";

export const catalogRoutes = Router();
catalogRoutes.get("/cities", asyncHandler(controller.cities));
catalogRoutes.get(
  "/venues",
  validate({ query: venueQuerySchema }),
  asyncHandler(controller.venues),
);

catalogRoutes.get("/matches", asyncHandler(controller.getMatches));
catalogRoutes.get(
  "/matches/:matchId/tickets",
  validate({ params: matchIdParamsSchema }),
  asyncHandler(controller.getMatchTickets),
);

catalogRoutes.get("/competitions", asyncHandler(controller.getCompetitions));
catalogRoutes.get(
  "/competitions/:competitionId/tickets",
  validate({ params: competitionIdParamsSchema }),
  asyncHandler(controller.getCompetitionTickets),
);
