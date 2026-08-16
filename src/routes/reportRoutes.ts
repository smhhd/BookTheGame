import { Router } from "express";
import * as controller from "../controllers/reportController";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { createReportSchema } from "../validators/reportValidators";

export const reportRoutes = Router();
reportRoutes.use(authenticate);
reportRoutes.post("/", validate({ body: createReportSchema }), asyncHandler(controller.create));
reportRoutes.get("/my", asyncHandler(controller.my));
reportRoutes.get("/categories", asyncHandler(controller.categories));
