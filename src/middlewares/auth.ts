import { RequestHandler } from "express";
import { findUserById } from "../repositories/userRepository";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { verifyToken } from "../services/tokenService";

export const authenticate: RequestHandler = asyncHandler(async (request, _response, next) => {
  const authorization = request.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(401, "AUTH_REQUIRED", "Bearer authentication is required");
  }
  const payload = verifyToken(authorization.slice(7));
  const user = await findUserById(payload.userId);
  if (!user) throw new AppError(401, "INVALID_TOKEN", "Authentication token is invalid");
  if (user.status !== "active") {
    throw new AppError(403, "ACCOUNT_INACTIVE", "Account is not active");
  }
  request.auth = { userId: user.user_id, role: user.role_name };
  next();
});

export const requireSupport: RequestHandler = (request, _response, next) => {
  if (request.auth?.role !== "support") {
    next(new AppError(403, "SUPPORT_REQUIRED", "Support access is required"));
    return;
  }
  next();
};
