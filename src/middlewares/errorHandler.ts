import { ErrorRequestHandler, RequestHandler } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ZodError } from "zod";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

interface PgError extends Error {
  code?: string;
  constraint?: string;
}

interface HttpBodyError extends Error {
  status?: number;
  type?: string;
}

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(404, "ROUTE_NOT_FOUND", `Route ${request.method} ${request.path} was not found`));
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  let appError: AppError;
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof ZodError) {
    appError = new AppError(400, "VALIDATION_ERROR", "Request validation failed", error.issues);
  } else if (error instanceof TokenExpiredError) {
    appError = new AppError(401, "TOKEN_EXPIRED", "Authentication token has expired");
  } else if (error instanceof JsonWebTokenError) {
    appError = new AppError(401, "INVALID_TOKEN", "Authentication token is invalid");
  } else {
    const bodyError = error as HttpBodyError;
    const pgError = error as PgError;
    if (bodyError.status === 400 && bodyError.type === "entity.parse.failed") {
      appError = new AppError(400, "MALFORMED_JSON", "Request body contains invalid JSON");
    } else if (bodyError.status === 413 && bodyError.type === "entity.too.large") {
      appError = new AppError(413, "PAYLOAD_TOO_LARGE", "Request body is too large");
    } else if (pgError.code === "23505") {
      appError = new AppError(409, "DUPLICATE_RESOURCE", "A unique value already exists", [
        { constraint: pgError.constraint }
      ]);
    } else if (pgError.code === "23503" || pgError.code === "23514") {
      appError = new AppError(422, "DATABASE_CONSTRAINT", "The operation violates a data rule");
    } else {
      appError = new AppError(500, "INTERNAL_ERROR", "An unexpected error occurred");
      console.error("Unhandled request error", {
        message: error instanceof Error ? error.message : String(error),
        ...(env.NODE_ENV !== "production" && error instanceof Error ? { stack: error.stack } : {})
      });
    }
  }

  response.status(appError.status).json({
    success: false,
    message: appError.message,
    error: { code: appError.code, details: appError.details }
  });
};
