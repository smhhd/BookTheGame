import { Request, Response } from "express";
import { pay } from "../services/paymentService";
import { success } from "../utils/response";

export async function create(request: Request, response: Response) {
  const data = await pay({ userId: request.auth!.userId, ...request.body });
  return success(
    response,
    data,
    data.status === "success" ? "Payment completed successfully" : "Payment failed",
    201
  );
}
