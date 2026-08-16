import { Router } from "express";
import * as controller from "../controllers/userController";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { updateProfileSchema } from "../validators/userValidators";

export const userRoutes = Router();
userRoutes.use(authenticate);
userRoutes.get("/me", asyncHandler(controller.getMe));
userRoutes.patch(
  "/me",
  validate({ body: updateProfileSchema }),
  asyncHandler(controller.updateMe)
);
