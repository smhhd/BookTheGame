import { Response } from "express";

export function success(
  response: Response,
  data: unknown,
  message = "Operation completed successfully",
  status = 200
): Response {
  return response.status(status).json({ success: true, message, data });
}
